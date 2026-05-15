package com.fitai.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fitai.dto.request.ChatMessageDto;
import com.fitai.dto.response.ProgressResponse;
import com.fitai.model.MealEntry;
import com.fitai.model.UserProfile;
import com.fitai.repository.MealEntryRepository;
import com.fitai.repository.UserProfileRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;

@Service
public class ChatService {

    private final UserProfileRepository profileRepository;
    private final MealEntryRepository   mealEntryRepository;
    private final ProgressService       progressService;
    private final GeminiService         geminiService;
    private final ObjectMapper          objectMapper;

    public ChatService(UserProfileRepository profileRepository,
                       MealEntryRepository mealEntryRepository,
                       ProgressService progressService,
                       GeminiService geminiService,
                       ObjectMapper objectMapper) {
        this.profileRepository  = profileRepository;
        this.mealEntryRepository = mealEntryRepository;
        this.progressService    = progressService;
        this.geminiService      = geminiService;
        this.objectMapper       = objectMapper;
    }

    public String chat(String userId, String message, List<ChatMessageDto> history) {
        // Profile — for name, gender, height, activity level (not all in ProgressResponse)
        UserProfile profile = profileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Profile not found"));

        // All computed progress numbers (reuses ProgressService to avoid duplicating logic)
        // Chat always gives context for today (not a navigated historical date)
        ProgressResponse progress = progressService.getProgress(userId, LocalDate.now());

        // Today's macros — sum all entries for today
        List<MealEntry> todayEntries = mealEntryRepository
                .findByUserIdAndDateOrderByCreatedAtAsc(userId, LocalDate.now());
        double todayProtein = todayEntries.stream().mapToDouble(e -> e.getProteinG().doubleValue()).sum();
        double todayCarbs   = todayEntries.stream().mapToDouble(e -> e.getCarbsG().doubleValue()).sum();
        double todayFat     = todayEntries.stream().mapToDouble(e -> e.getFatG().doubleValue()).sum();

        // Macro recommendations based on body weight
        double weight     = profile.getWeightKg().doubleValue();
        int minProtein    = (int) Math.round(1.6 * weight);
        int maxProtein    = (int) Math.round(2.2 * weight);
        int minCarbs      = (int) Math.round(3.0 * weight);
        int maxCarbs      = (int) Math.round(5.0 * weight);
        int minFat        = (int) Math.round(0.8 * weight);
        int maxFat        = (int) Math.round(1.2 * weight);

        String systemPrompt = buildSystemPrompt(profile, progress,
                todayProtein, todayCarbs, todayFat,
                minProtein, maxProtein, minCarbs, maxCarbs, minFat, maxFat);

        // Build Groq message array: [system, ...history, current user message]
        ArrayNode messages = objectMapper.createArrayNode();
        messages.add(objectMapper.createObjectNode().put("role", "system").put("content", systemPrompt));

        if (history != null) {
            for (ChatMessageDto h : history) {
                messages.add(objectMapper.createObjectNode()
                        .put("role", h.getRole())
                        .put("content", h.getContent()));
            }
        }
        messages.add(objectMapper.createObjectNode().put("role", "user").put("content", message));

        return geminiService.chat(messages);
    }

    // ── System prompt builder ─────────────────────────────────────────────────

    private String buildSystemPrompt(UserProfile profile, ProgressResponse p,
                                     double todayProtein, double todayCarbs, double todayFat,
                                     int minProtein, int maxProtein,
                                     int minCarbs,   int maxCarbs,
                                     int minFat,     int maxFat) {

        String goalOffsetLabel = "cutting".equals(profile.getGoal()) ? "deficit" : "surplus";
        String todayDeltaLabel = p.getTodaySurplusDeficit() < 0 ? "deficit" : "surplus";
        String accDeltaLabel   = p.getAccumulatedSurplusDeficit() < 0 ? "deficit" : "surplus";
        String weightDirLabel  = p.getEstimatedWeightChangeKg() <= 0 ? "lost" : "gained";

        return "You are a personal fitness and nutrition assistant. You have full knowledge of this user's " +
               "stats, goals and current progress. Use all of this context to give personalized, practical advice.\n\n" +

               "== USER PROFILE ==\n" +
               "Name: " + profile.getName() + "\n" +
               "Age: " + profile.getAge() + "\n" +
               "Gender: " + profile.getGender() + "\n" +
               "Weight: " + String.format("%.1f", profile.getWeightKg().doubleValue()) + "kg\n" +
               "Height: " + String.format("%.1f", profile.getHeightCm().doubleValue()) + "cm\n" +
               "Activity level: " + profile.getActivityLevel() + " (works out " + workoutFrequency(profile.getActivityLevel()) + ")\n" +
               "Goal: " + profile.getGoal() + "\n" +
               "Daily calorie offset: " + profile.getCalorieTargetOffset() + " kcal (" + goalOffsetLabel + ")\n" +
               "TDEE: " + p.getTdee() + " kcal\n" +
               "Daily calorie target: " + p.getDailyCalorieTarget() + " kcal\n\n" +

               "== TODAY'S INTAKE ==\n" +
               "Calories: " + p.getTodayCalories() + " kcal / " + p.getDailyCalorieTarget() + " kcal target\n" +
               "Protein: " + String.format("%.1f", todayProtein) + "g (recommended: " + minProtein + "g – " + maxProtein + "g)\n" +
               "Carbs: "   + String.format("%.1f", todayCarbs)   + "g (recommended: " + minCarbs   + "g – " + maxCarbs   + "g)\n" +
               "Fat: "     + String.format("%.1f", todayFat)     + "g (recommended: " + minFat     + "g – " + maxFat     + "g)\n" +
               "Today's " + todayDeltaLabel + ": " + Math.abs(p.getTodaySurplusDeficit()) + " kcal\n\n" +

               "== ACCUMULATED PROGRESS ==\n" +
               "Total accumulated " + accDeltaLabel + ": " + Math.abs(p.getAccumulatedSurplusDeficit()) + " kcal\n" +
               "Estimated weight " + weightDirLabel + " so far: " +
                       String.format("%.2f", Math.abs(p.getEstimatedWeightChangeKg())) + " kg\n\n" +

               "== YOUR ROLE ==\n" +
               "- Answer only fitness and nutrition related questions\n" +
               "- Give advice that is balanced, science-based and tailored to this user's exact stats and goal\n" +
               "- If the user is cutting, prioritize high protein, moderate carbs, lower fat advice\n" +
               "- If the user is bulking, prioritize caloric surplus, high protein, and performance-focused advice\n" +
               "- If the user is just counting calories, give balanced general nutrition advice\n" +
               "- Always be aware of what the user has already eaten today and factor it into your recommendations\n" +
               "- Be concise, friendly and practical\n" +
               "- If asked something unrelated to fitness or nutrition, politely redirect the conversation";
    }

    private String workoutFrequency(String activityLevel) {
        if (activityLevel == null) return "0 times/week (sedentary)";
        return switch (activityLevel) {
            case "lightly_active"    -> "1–2 times/week";
            case "moderately_active" -> "3–4 times/week";
            case "very_active"       -> "5–6 times/week";
            case "extremely_active"  -> "every day (7 days/week)";
            default                  -> "0 times/week (sedentary)";
        };
    }
}
