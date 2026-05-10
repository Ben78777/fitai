@REM ----------------------------------------------------------------------------
@REM Maven Wrapper startup batch script
@REM ----------------------------------------------------------------------------
@IF "%__MVNW_ARG0_NAME__%"=="" (SET __MVNW_ARG0_NAME__=%~nx0)
@SET DP0=%~dp0

@SET MAVEN_PROJECTBASEDIR=%DP0%
@SET MVNW_VERBOSE=false

@IF NOT "%MVNW_VERBOSE%"=="" (
  @ECHO MAVEN_PROJECTBASEDIR: %MAVEN_PROJECTBASEDIR%
)

@SET WRAPPER_JAR="%MAVEN_PROJECTBASEDIR%.mvn\wrapper\maven-wrapper.jar"
@SET WRAPPER_LAUNCHER=org.apache.maven.wrapper.MavenWrapperMain

@SET DOWNLOAD_URL="https://repo.maven.apache.org/maven2/org/apache/maven/wrapper/maven-wrapper/3.3.2/maven-wrapper-3.3.2.jar"

@FOR /F "usebackq tokens=1,2 delims==" %%A IN ("%MAVEN_PROJECTBASEDIR%.mvn\wrapper\maven-wrapper.properties") DO (
    @IF "%%A"=="wrapperUrl" SET DOWNLOAD_URL=%%B
)

@SET JAVA_HOME_PARENT=%JAVA_HOME%
@SET MVNW_REPOURL=https://repo.maven.apache.org/maven2

@java -Dmaven.multiModuleProjectDirectory="%MAVEN_PROJECTBASEDIR%" -Dmaven.wrapper.launcher.debug=false -Dmaven.wrapper.target="%MAVEN_PROJECTBASEDIR%.mvn\wrapper\dists" -classpath %WRAPPER_JAR% "-Dmaven.wrapper.distributionUrl=https://repo.maven.apache.org/maven2/org/apache/maven/apache-maven/3.9.9/apache-maven-3.9.9-bin.zip" %WRAPPER_LAUNCHER% %*
