---
title: "Understanding Automation Test Layers"
description: "We can not test everything and we should not try to test everything documented on UI Automation Test layer. There are varieties of test layers are available whe"
pubDate: 2021-11-22
tags: ["test-pyramid","component-test"]
draft: false
heroImage: "/images/blog/post_pic_art_automation.jpg"
---

> We can not test everything and we should not try to test everything documented on UI Automation Test layer. There are varieties of test layers are available where documented tests can be divided. This will help us reduce execution and and increase fast feedback with positive side effect of shift left.

### The Balancing Act
Each activity and task in a project have cost, and it should also be associated to some business value. Testing is not an exception and unnecessary testing taks acn causes unnecessary delays and ends up incurring more costs. Also, there should not be incomplete or too less testing otherwise, there may be a chance of defective products to be handed to the end users. Therefore, software testing should be done appropriately.

<img width="832" alt="Screenshot 2022-05-06 at 4 56 04 PM" src="https://user-images.githubusercontent.com/19272137/167125160-f6893b22-2ae1-49f1-abb4-1ebf83e83134.png">

Triple constraint – the balancing act that occurs between cost, quality and time – is a term often heard in the world of project management. Quality Analyst should ensure that they successfully manage the scope of quality practices to keep it within the cost and time parameters set by stakeholders.

### Cost of Defect
Cost of fixing a defect is exponentially proposnate to time taken for it to get discovered and Teams decision to act on it. Earler we find the defect lower the cost would be to fix it. In below graph we can understand that as Qaulity analyst we need to be shifted left and perform our quality checks to find defects as early as possible.

<img width="737" alt="Screenshot 2022-05-06 at 5 02 50 PM" src="https://user-images.githubusercontent.com/19272137/167125231-ea2eddd0-6c7b-4885-b630-b4f29d08aa9e.png">

### Test Pyramid
Test Pyramid concept is best way to achieve shift left for Quality checks. It would also shift our mindset to `defect prevension` instead of `defect identification`. 

<img width="726" alt="Screenshot 2022-05-06 at 5 12 54 PM" src="https://user-images.githubusercontent.com/19272137/167125315-a1fab0af-5613-47a7-9cc6-7eae663a53b0.png">

We need to colaborate with app devs to understand the level of contribution we can make to ensure good test coverage in lower layers of test pyramid. That will help us reduce tests on higher layer that are too costly and usualy come with flakyness.

Lets try and understand what can be covered on individual test layers of test Pyramid.

<img width="306" alt="Screenshot 2022-05-06 at 5 13 55 PM" src="https://user-images.githubusercontent.com/19272137/167125356-282ebb84-3fbd-41e0-9999-c68175057b78.png">
- Functional, cross-functional, UI/JS classes (model, controller, view)
- Boundary values and edge cases
- Immediate feedback
- Safety net
- Lowest cost of implementation

<img width="308" alt="Screenshot 2022-05-06 at 5 13 50 PM" src="https://user-images.githubusercontent.com/19272137/167125367-9881d18b-afb9-4175-96d0-0cfc029a6044.png">

- Integration points
- API Contract tests
- API compatibility
- Regressive data validations
- dB interactions
- Service-level feedback on interactions

<img width="326" alt="Screenshot 2022-05-06 at 5 13 35 PM" src="https://user-images.githubusercontent.com/19272137/167125376-2b86e02b-4180-4d7a-89d0-ccf9dc0e29bf.png">

- Regressive end-to-end tests
- Functional/Cross-functional tests
- Feedback on functional interactions

<img width="316" alt="Screenshot 2022-05-06 at 5 13 29 PM" src="https://user-images.githubusercontent.com/19272137/167125380-2e3d6247-7c47-49b0-b5ab-a84bc14e46c8.png">

- End-to-end user journeys
- Tests UI interactions on browsers
- Tests from user’s point of view

### Feature of an effective automation suite
- Robustness
- Speed/Feedback cycle
- Debugging/Faster analysis of execution
- Maintainability
- Proneness to error

Implemetation of test pyramid help us achieve most of the above stated features of an effective autimation suite.

What do you think ? let me know your thought.

> happy testing :)

