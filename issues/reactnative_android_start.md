## （Mac平台）ReactNative Android开发环境搭建小计

目前ReactNative只支持Mac平台，iOS的开发环境比较简单，基本上只需要一个xcode即可。

Android开发环境需要装很多软件，而且问题比较多，本篇记录下。

### 安装软件

**Android Studio**

没啥好说的，翻墙从官网下载最新的安装包并安装。

**SDK及其他**

启动Android Studio，选择"Tools"-->"Android"-->"SDK Manager"，勾选以下项目：

- Android SDK Build-tools version 23.0.1
- Android 6.0 (API 23)
- Android Support Repository

这一步也需要翻墙，经过漫长的等待之后，成功安装。

**设置环境变量**

**模拟器**

手头没Android设备，所以需要装个Android模拟器。

回到SDK Manager界面，勾选并安装“Inter x86 Emulator Accelerator(HAXM installer)”，完成之后似乎还不能启动AVD创建界面，手动安装HAXM：在android sdk目录下找到extras文件夹，依次点进去"intel"-->"Hardware_Accelerated_Execution_Manager"，双击“IntelHAXM_1.1.4.dmg”安装。

安装上HAXM之后即可启动AVD Manager界面，然后创建模拟器：

![reactnative avd](https://raw.githubusercontent.com/chemdemo/chemdemo.github.io/master/img/reactnative_android/avd.jpg)

**Android环境设置**

全局环境变量设置：

``` bash
$ vim ~/.bash_profile
$ export ANDROID_HOME="/Users/[your name]/Library/Android/sdk/android-sdk_r24.2" # 以实际位置为准
$ source ~/.bash_profile # 立即生效
```

或者在初始化的项目中`android`目录下新建文件`local.properties`，内容是:

``` bash
sdk.dir=/Users/[your name]/Library/Android/sdk/android-sdk_r24.2
```

**Node.js以及React命令行模块**

从官网下载最新的Node.js并安装，过程略。

安装cli模块:

``` bash
$ npm install -g react-native-cli
```

**安装watchman**

watchman是mac平台的一个用于监听文件变化的软件，热更新的时候需要它。

``` bash
$ brew install watchman
```

**安装flow**

flow是mac平台下一个FTP + SFTP客户端。

``` bash
$ brew install flow
```

### 初始化app

``` bash
$ react-native init [appname]
```

这一步也很慢，失败之后重试几遍。成功后会在当前目录生成以`appname`为名的项目文件夹，结构如下：

``` bash
$ cd [appname]
$ ll
total 24
drwxr-xr-x  12 dmyang  staff   408B  9 20 16:09 android
drwxr-xr-x   2 dmyang  staff    68B  9 23 17:48 app
-rw-r--r--   1 dmyang  staff   1.0K 10 10 14:48 index.android.js
-rw-r--r--   1 dmyang  staff   1.0K  9 18 23:35 index.ios.js
drwxr-xr-x   7 dmyang  staff   238B  9 19 19:34 ios
drwxr-xr-x   4 dmyang  staff   136B  9 18 23:35 node_modules
-rw-r--r--   1 dmyang  staff   202B  9 18 23:35 package.json
```

### 编译app

对于iOS，比较简单，进入`ios/`目录下，双击`[appname].xcodeproj`文件即可运行。

对于Android，需要编译成apk安装包模拟器里边，运行：

直到“BUILD SUCCESSFUL”

``` bash
$ react-native run-android
Starting JS server...
Building and installing the app on the device (cd android && ./gradlew installDebug)...
:app:preBuild UP-TO-DATE
:app:preDebugBuild UP-TO-DATE
:app:checkDebugManifest
:app:preReleaseBuild UP-TO-DATE
:app:prepareComAndroidSupportAppcompatV72300Library UP-TO-DATE
:app:prepareComAndroidSupportSupportV42300Library UP-TO-DATE
:app:prepareComFacebookFrescoDrawee061Library UP-TO-DATE
:app:prepareComFacebookFrescoFbcore061Library UP-TO-DATE
:app:prepareComFacebookFrescoFresco061Library UP-TO-DATE
:app:prepareComFacebookFrescoImagepipeline061Library UP-TO-DATE
:app:prepareComFacebookFrescoImagepipelineOkhttp061Library UP-TO-DATE
:app:prepareComFacebookReactReactNative0110Library UP-TO-DATE
:app:prepareOrgWebkitAndroidJscR174650Library UP-TO-DATE
:app:prepareDebugDependencies
:app:compileDebugAidl UP-TO-DATE
:app:compileDebugRenderscript UP-TO-DATE
:app:generateDebugBuildConfig UP-TO-DATE
:app:generateDebugAssets UP-TO-DATE
:app:mergeDebugAssets UP-TO-DATE
:app:generateDebugResValues UP-TO-DATE
:app:generateDebugResources UP-TO-DATE
:app:mergeDebugResources UP-TO-DATE
:app:processDebugManifest UP-TO-DATE
:app:processDebugResources UP-TO-DATE
:app:generateDebugSources UP-TO-DATE
:app:processDebugJavaRes UP-TO-DATE
:app:compileDebugJavaWithJavac UP-TO-DATE
:app:compileDebugNdk UP-TO-DATE
:app:compileDebugSources UP-TO-DATE
:app:preDexDebug UP-TO-DATE
:app:dexDebug UP-TO-DATE
:app:validateDebugSigning
:app:packageDebug UP-TO-DATE
:app:zipalignDebug UP-TO-DATE
:app:assembleDebug UP-TO-DATE
:app:installDebug
Installing APK 'app-debug.apk' on 'reactnative(AVD) - 6.0'
Installed on 1 device.

BUILD SUCCESSFUL

Total time: 20.947 secs
```

直到“BUILD SUCCESSFUL”。

这一步是问题最多的，务必确认`android/app/src/build.gradle`里的sdk和build tool版本已经（在SDK Manager）安装。

笔者碰到的问题是“unable to download js bundle”，如下图：

![reactnative avd](https://raw.githubusercontent.com/chemdemo/chemdemo.github.io/master/img/reactnative_android/build_error.jpg)

经过几番折腾，发现是watchman版本问题，更新下即可：

``` bash
$ brew update && brew upgrade watchman
```

编译安装好apk之后，就可以在模拟器启动app：

![reactnative avd](https://raw.githubusercontent.com/chemdemo/chemdemo.github.io/master/img/reactnative_android/start.jpg)

app只需要编译一遍，安装到模拟器里边之后，以后的开发只需要打开app+刷新app即可看到更新的效果。

Android版本是通过`Fn+F2`来刷新，iOS是通过`control+r`来刷新。

通过以下命令来监听文件的改变以达到实时刷新：

``` bash
$ react-native start
```

致此，开发环境算是搭建起来的。
