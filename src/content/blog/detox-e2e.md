---
title: "Shif left in Mobile App Automation Testing"
description: "Do you want to get rid mobile app object inspection and also tired of maintaining 2 versions of locators to deal with ios and android systems separately ? Try o"
pubDate: 2022-04-27
tags: ["test-pyramid","component-test","detox","mobile-automation"]
draft: false
heroImage: "/images/blog/post_pic_detox.jpg"
---

> Do you want to get rid mobile app object inspection and also tired of maintaining 2 versions of locators to deal with ios and android systems separately ? Try out Detox e2e gray box automation solution. It will help you shift left and can build a solid defect prevention platform.
> Detox will help you run test as soon developer make a change in feature and get it validate in close proximity of unit/integration test. yes, you heard right. Detox e2es will run in close proximity of unit/integration tests. 
    
## Detox Design Principles
Not
- WebDriver
- Black box
    
It is
- Gray box
- Synchronization with App’s activity.
- First-class React Native support.
- Expectations run on the app, not the tester process.

## Automated testing framework by Google
Espresso
- Native framework for Android automated testing.
- Automatic synchronization
- Simple and lightweight API.
- Doesn’t require server communication 
- Espresso allows compiling automated Android UI tests into a separate APK i.e., the test suite will run next to the app on the device.

EarlGray
- Native iOS UI automation test framework 
- Automatically synchronizes with the UI, network requests, and various queues.
- EarlGrey is faster and effective in comparison to XCUITest.

## Prerquisite
$ xcrun simctl list
$ open -a Simulator --args -CurrentDeviceUDID <UDID>

$ ANDROID_HOME/tools/bin/avdmanager create avd -n <emulatorname> -d pixel --package  "system-images;android-30;google_apis;x86"
$ ANDROID_HOME/emulator/emulator -verbose @<emulatorname>
  
 WIP - Please hold on 

