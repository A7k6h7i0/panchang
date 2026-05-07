import java.io.File

allprojects {
    repositories {
        google()
        mavenCentral()
    }
}

// Keep Android outputs in the Flutter project-root build directory so
// `flutter run` can discover the generated APK.
val flutterRootBuildDir = File(rootDir, "../build").canonicalFile
rootProject.buildDir = flutterRootBuildDir

subprojects {
    project.buildDir = File(flutterRootBuildDir, project.name)
}
subprojects {
    project.evaluationDependsOn(":app")
}
