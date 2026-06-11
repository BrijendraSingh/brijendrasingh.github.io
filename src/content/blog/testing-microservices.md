---
title: "Microservices Test Strategy"
description: "Testing Microservices is not an easy task when number of microservices keeps increasing and over the time. As number of services increases, so too does the comp"
pubDate: 2022-05-11
tags: ["test-pyramid","component-test","microservices","api-automation","contract-test"]
draft: false
heroImage: "/images/blog/post_pic_micro_test_strategy.png"
---

> Testing Microservices is not an easy task when number of microservices keeps increasing and over the time. As number of services increases, so too does the complexity. Whether it’s database errors, network latency, caching issues, or service unavailability.
> It creates another level of chaos when multiple teams are building microservices that are interconnected. 
> This problem can not be solved by just chosing a tool for API testing and writing as much as possible e2e on UI layers. 
> A proper thought process and proper test strategy is needed to understand the dependencies and complexicity of microservice architecture being used and applied to the project.
> Lets dig down futhur and find a solution for this problem.

## Why Project Chose Microservice ?
Microservices are independent or very loosly coupled services which can be independently developed and deployed. This helps dev teams to build and scale application or software.

Using microservices architecture in software development can bring below benefits:
- `modularity` : Because each service is a separate component, team can scale up a single function or service without having to scale the entire application.
- `easier to develop, test, deploy and maintain applications` 
- `easy to adopt technology` : individual services can use its own language, framework based on their use can and need.
    
> Happy Testing :)

