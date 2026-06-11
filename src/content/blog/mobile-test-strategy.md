---
title: "How to build Test Strategy for Mobile Applications"
description: "How we can build a Mobile test Strategy to cover all possible aspects of mobile devices specific conditions, device selection, tool selection"
pubDate: 2022-05-07
tags: ["mobile-test-strategy","mobile-testing","mobile-automation"]
draft: false
heroImage: "/images/blog/post_pic_mobile_strategy.jpg"
---

> How we can build a Mobile test Strategy to cover all possible aspects of mobile devices specific conditions, device selection, tool selection

## Why Test Strategy is important ?
The purpose of a Test Strategy is to create an understanding of the overall targets, approach, tools and timing of test activities to be done. It should clarify the major challenges and tasks of the test project.

## How do you build mobile test strategy ?
we should avoid some anti patterns while building test strategy
* Look for template available in your organization
* Ask your colleagues 
* Look online

**Do you see a problem in this approach ?** 
Earlier stated approach may not be directly applicable to your project.
As your app may have specific need, function and target user

## Your app may have unique requirements
understanding business behind the app, stakholders mindset and proposed technical arcitecture is important.

## You should seek answer to these questions first
- Who are the various stakeholders on who quality would be dependent?
- Do you have a RACI* matrix for the most important processes? 
- Thought about Definition of Done ?
- Any CI/CD pipeline guideline that would ensure quality is shifted left ?
- What would be the release frequency ?
- Possible Testing bottleneck ? 
- What are the Legal requirements ?
- Failure points ?
- What would happen if quality is not maintained ?
- Tech Architecture ? 

#### RACI matrix
RACI Matrix is a table that lists all stakeholders on a project and their level involvement in each task. This assists with reducing confusion on expectations, in turn, increasing project efficiency and improving deliverables and also helps in reducing risk.

<figure>
	<a href="https://user-images.githubusercontent.com/19272137/167105977-6bb1ddcd-ba8a-4098-913d-abebe837dd5a.png"><img src="https://user-images.githubusercontent.com/19272137/167105977-6bb1ddcd-ba8a-4098-913d-abebe837dd5a.png"></a>
</figure>

**Responsible:** The person who does the work to achieve the task. As a rule, this is one person; examples might be a business analyst, application developer or technical architect. They have responsibility for getting the work done or decisions made.

**Accountable:** The person who is responsible for the correct and thorough completion of the task. This role must be one person and is often the project executive or project sponsor. This role is in the role that responsible is accountable to and approves their work.

**Consulted:** The people who provide information for the project and with whom there is two-way communication. This role is usually several people, often subject matter experts.

**Informed:** The people kept informed of progress and with whom there is one-way communication. These are people affected by the outcome of the tasks, so they need to be kept up to date.

## Business priorities
* What is the client most worried about?
* Who are the implicit users?
* What is the risk appetite of the client in case of a calamity in production?

## Identify your app
<figure>
	<a href="https://user-images.githubusercontent.com/19272137/167109144-bbaf06a8-8224-420e-9ca4-2dd8b48660de.png"><img src="https://user-images.githubusercontent.com/19272137/167109144-bbaf06a8-8224-420e-9ca4-2dd8b48660de.png"></a>
</figure>

* **Native mobile apps (i.e., downloadable apps)** are smartphone apps specifically designed for a particular operating system—iOS or Android. They are written in cross-platform frameworks like React Native or platform-specific languages such as Swift or Objective-C (for iOS) or Java or Kotlin (for Android). Native apps are installed on a device. They are built using an operating system’s SDKs and have access to different resources on a device: camera, GPS, phone, device storage, etc.
* **Web mobile apps** are websites optimized for mobile browsers. Their functionality resides entirely on a server. They are written in JavaScript and HTML5.
* **Hybrid mobile apps** combine features of native and web apps. They are written in HTML5 and JavaScript, like web apps. For the most part, they are web pages wrapped in a mobile app using WebView. However, they also have access to the built-in capabilities of a device. They are built using cross-platform frameworks like React, Ionic, Sencha and Xamarin.
* **Progressive web apps (PWAs)** are web applications designed to work on any standards-compliant web browser on both desktop and mobile devices. They are written in JavaScript, HTML, and CSS. They function like native mobile apps in that they use an app shell that allows for app-style gestures and navigations.

## Target Platform
There are many things to consider like. for which set of devices you want to provide test coverage. This can include Device Model (brand) and possible OS variants. Minimum OS support for specific platform. OS version feature compatibility (some features and effect may behave different for different OS versions)
<figure>
	<a href="https://user-images.githubusercontent.com/19272137/167079894-b69e9e2c-b49c-4a1b-a24a-a4df4687f2a4.png"><img src="https://user-images.githubusercontent.com/19272137/167079894-b69e9e2c-b49c-4a1b-a24a-a4df4687f2a4.png"></a>
</figure>

## Device Selection for testing
<figure>
	<a href="https://user-images.githubusercontent.com/19272137/167106080-7e5adae0-a918-4779-8a84-e25f384efdb5.png"><img src="https://user-images.githubusercontent.com/19272137/167106080-7e5adae0-a918-4779-8a84-e25f384efdb5.png"></a>
</figure>

- What hardware/software combination to make
- virtual/real device or cloud?
- Fat finger issues

## Custom Settings
Customs setting are device and OS specific and falls outside the perimeter of application business scope. Testing your app with the possible combination of custom phone/device settings will provide you high confidence to go live. Something that needs to be manually tested.
<figure>
	<a href="https://user-images.githubusercontent.com/19272137/167080181-3a095a46-7301-45ac-853c-4a54eaed63b3.png"><img src="https://user-images.githubusercontent.com/19272137/167080181-3a095a46-7301-45ac-853c-4a54eaed63b3.png"></a>
</figure>

## Interruptions 
Interruptions are the key features of the mobile device and should not be hampered by application under test. Interruptions should not be the reason for your app to misbehave in certain circumstances too. Something that needs to be manually tested.
<figure>
	<a href="https://user-images.githubusercontent.com/19272137/167080432-3aa17414-60ae-4ea9-b13e-3b1f0329d820.png"><img src="https://user-images.githubusercontent.com/19272137/167080432-3aa17414-60ae-4ea9-b13e-3b1f0329d820.png"></a>
</figure>

## Specific conditions
_**Device specific conditions**_
* Memory consumption
* Power utilization
* Network connectivity
* Operating in the background
* Switching between applications
* Memory leakage
* Storage
* Image capture/upload/scan
* File download
* Location

_**Application Specific Conditions**_
- Installation
- Uninstallation
- Update
- Backward compatibility
- App launch
- App data

## Testing type
Based on your application and use case you may need to pick and prioritise the type of testing needed to be covered for smooth prod deployment confidence.
<figure>
	<a href="https://user-images.githubusercontent.com/19272137/167106187-f84231b7-76f1-4d80-b750-a40ca0f33ba0.png"><img src="https://user-images.githubusercontent.com/19272137/167106187-f84231b7-76f1-4d80-b750-a40ca0f33ba0.png"></a>
</figure>

## Path to production
CI/CD pipeline looks a little bit different from regular web based applications. as it may involve app artefact generation. app store certification and Apple app store and Google play store integration before app can be made available to users for download with rollout plan. And not forgetting the needs of all required quality checks on each layer and stages. 

<figure>
	<a href="https://user-images.githubusercontent.com/19272137/167112101-1652dbaf-988e-4683-b76a-679c3d03958e.png"><img src="https://user-images.githubusercontent.com/19272137/167112101-1652dbaf-988e-4683-b76a-679c3d03958e.png"></a>
</figure>

## Automation Testing
What and where we can automation? shall we consider below tests for our automation ?
The answer is `yes`, we should consider all available test layers for automation testing.
<figure>
	<a href="https://user-images.githubusercontent.com/19272137/167080854-6d47b8c9-e058-462b-a563-bfc11c387ace.png"><img src="https://user-images.githubusercontent.com/19272137/167080854-6d47b8c9-e058-462b-a563-bfc11c387ace.png"></a>
</figure>
take advantages of lower level automated tests

## Define test pyramid
Decide % distribution of tests in each layer -> it will vary based of project stack characteristics however the overall test volume and its division will form a pyramid structure. 
<figure>
	<a href="https://user-images.githubusercontent.com/19272137/167081022-04defe91-c701-4b28-8a8e-256eaa53f23b.png"><img src="https://user-images.githubusercontent.com/19272137/167081022-04defe91-c701-4b28-8a8e-256eaa53f23b.png"></a>
</figure>

## Automation tool and framework selection
There are lot of tools available in the market providing similar functionalities. How one should take a decision ?
<figure>
	<a href="https://user-images.githubusercontent.com/19272137/167081138-60cd467a-5763-45d2-85d6-17813fb7601b.png"><img src="https://user-images.githubusercontent.com/19272137/167081138-60cd467a-5763-45d2-85d6-17813fb7601b.png"></a>
</figure>

### Below points can help 
- List down different mobile test automation options
- Advantages and disadvantages of cross-platform v/s native frameworks
- How to choose the right mobile test automation framework for your testing needs
- How to leverage the unique benefits of a testing cloud
- Refer official documentation 
<figure>
	<a href="https://user-images.githubusercontent.com/19272137/167589798-7501bb01-1af7-4ce7-aadd-54f51d9fade3.png"><img src="https://user-images.githubusercontent.com/19272137/167589798-7501bb01-1af7-4ce7-aadd-54f51d9fade3.png"></a>
</figure>

## Try Pugh Matrix comparison
<figure>
	<a href="https://user-images.githubusercontent.com/19272137/167081349-17e2ea21-2fd9-4edb-8fcd-505895c7a090.png"><img src="https://user-images.githubusercontent.com/19272137/167081349-17e2ea21-2fd9-4edb-8fcd-505895c7a090.png"></a>
</figure>
The Pugh Matrix is a decision-making tool to compare multiple alternatives. The steps that you will take to create your Pugh Matrix are:

- Define your evaluation criteria. What are the most important and desired characteristics of your solution?
- Weight your evaluation criteria as to the relative importance of each.
- Define your different improvement alternatives and optional approaches.
- Select a “BASELINE” from the alternatives, which will typically be your current state.
- For each criteria, rate each alternative as better, same, or worse than your baseline. You can use a simple + for better, s for same, and – for worse.
- Total the count of each.
- Select your best alternative.
- Explore whether an even more optimal solution might exist by creating a hybrid of the best from various alternatives.
Read more on: https://www.isixsigma.com/dictionary/pugh-matrix/

## Be aware of
Number of choices increases due to:
* Available list of tools/frameworks - Democratization of source code led to development of tools with similar features but subtle differences
* Team constraints/preferences
* Client requirements
<figure>
	<a href="https://user-images.githubusercontent.com/19272137/167093649-dc48b735-3d8f-4a3f-9d6e-1cc56e67cdf1.png"><img src="https://user-images.githubusercontent.com/19272137/167093649-dc48b735-3d8f-4a3f-9d6e-1cc56e67cdf1.png"></a>
</figure>

## Identify your risk
- What to test first and what to test last
- Risk based approach to determine testing automation priority
- You can determine risk/priority of each thing you want to test
- Consider making RAID matrix
<figure>
	<a href="https://user-images.githubusercontent.com/19272137/167108106-927de03d-096c-40f4-ab40-261200d913c2.png"><img src="https://user-images.githubusercontent.com/19272137/167108106-927de03d-096c-40f4-ab40-261200d913c2.png"></a>
</figure>

* A key part of any test automation strategy is knowing what to test first and what to test last. 
* You should use a risk-based approach to determine this testing automation priority. 
* You can determine the risk, or priority, of each thing you want to test by figuring out its business impact and adding that to the probability of it failing. 
* Obviously, the things with the highest business impact and highest probability of failure should be highest on your priority list, while the things with the lowest business impact and lowest probability of failure should be at the bottom. 
* This will also help quite a lot with the aforementioned testing squeeze and knowing what you want to cut first.

## Importance of Manual Exploratory Testing
Never forget Manual Exploratory testing has its own spacial place and it can not be overlooked and avoided.

> Happy Testing :)


