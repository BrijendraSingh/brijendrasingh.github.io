---
title: "End to End Testing using component strategy"
description: "Component Testing"
pubDate: 2021-12-10
tags: ["test-pyramid","component-test"]
draft: false
heroImage: "/images/blog/post_pic_component_test.jpg"
---

> `Component Testing` is an approach where we divide the automated test in applicable layer and target specific responsibilty of various components to reduce software components `interdependencies`, `time` and logic `complexcity`.

This can be beter understood with Test Pyramid approach.
<figure>
	<a href="https://user-images.githubusercontent.com/19272137/140619113-02b42a32-ca5f-4149-bad4-86c6d20dc1b3.png"><img src="https://user-images.githubusercontent.com/19272137/140619113-02b42a32-ca5f-4149-bad4-86c6d20dc1b3.png"></a>
</figure>

### Usual practice
<figure>
	<a href="https://user-images.githubusercontent.com/19272137/140619562-209459dc-baf5-457d-852c-f79b564fbf51.png"><img src="https://user-images.githubusercontent.com/19272137/140619562-209459dc-baf5-457d-852c-f79b564fbf51.png"></a>
</figure>

We have observed a pattern of writing End to End Automated test by only targetting GUI to validate the complete business logic. 
This approach can work if
- backend service is very simple and not much business logic and flows are involved
- basic data repository with select data sets

However, I wont recommend this way of writing End End Test targeting complete business logic on UI layer.

### Component approach
We should first understand the application component responsibilites and then breakdown the business logic to its parts. This will help us to write more effective E2Es.
This will hellp us to
- Reduce the flacky tests.
- Drastically reduce the feedback time.
- Accurate e2e failure Analysis to find out the application flawd area.

Lets take an example and breakdown the components
Below are the suggested component based on below example. Complete business logic is broken down to 2 parts.
<figure>
	<a href="https://user-images.githubusercontent.com/19272137/140618659-9edba9f8-2e68-47a1-bba3-9b045b6c12cb.png"><img src="https://user-images.githubusercontent.com/19272137/140618659-9edba9f8-2e68-47a1-bba3-9b045b6c12cb.png"></a>
</figure>

**Business logic 1** : Data Aggregation/batch logic
- Aggregation component test

**Business logic 2** : Application service logic
- API Component test
- UI component test and
- Finally the System Test
- Lets put some light on these component test

#### lets dig deep in each component layer.

**Data aggregation/batch component test** 
If your application involves Data aggregation or batch data processing then its become important to test the aggregation/batch business logic in this layer only.
reason:
- Testing this logic on UI E2E will consume unexpectedly longer time to retrieve data from data warehouse
- Also, an aggregation/batch execution dependency is also added here which may cause test failure when components are not in sync

**UI Component test** 
We may not always have control on our application test data, this may lead to added trouble of creating and maintaining Test data specific to the business case and its corresponding edge and corner cases.
- We can always take control over API responses and fed GUI the mock data/response which can be used to validate specific business case and its reflection to GUI.
- This way we can cut off backend dependency and make UI E2E more robust and reliable

**API Component test** 
Lets take an example of login feature. its not a best practice of testing every login combination on UI layer
- We can have bare minimum test on UI E2E and rest of the login logic can be tested on API layer
- We can also test Authorization and Role based access and negaive condition on API Test layer
- This will cut off the UI dependency while validating business logic and hence improving test coverage with minimum execution and less invalid test failures

**System test** 
So far we have tested application on it varuous component level. System test can be used to test the complete Integration (If posible) front end and ba
ckend logic In this layer we should have least numner of automated test covering only the haapy criticle path

> happy testing :)

