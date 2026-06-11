---
title: "Keys to become an effective QA"
description: "Prevention is better than cure!"
pubDate: 2022-05-25
tags: ["test-pyramid","component-test","test-strategy"]
draft: false
heroImage: "/images/blog/defects-prev.jpg"
---

> `Prevention is better than cure!` 
> 
> let's find out how shifting `QA mindset` from defect `detection` to defect `Prevention` can help YOUR team achieve goals without causing testing bottlenecks. 

## Why to avoid defect detection
Finding and fixing defects provides the software team boost of confidence to go ahead with production release. However, finding defects in later stages of software development life cycle (SDLC) may cause delay in time to production. This can also be the reason for some compromises with quality. Defects might need to be deprioritized so that the team can perform release on time.

Let's recall the SDLC flow.
> - Requirement Gathering and Analysis
> - Development
> - Testing
> - Deployment

We will figure out together what may go wrong, if we go ahead with a mindset of finding defects post feature deployment to the dev/QA environment. 
- RCA concluded to be a requirement change
- Unit/Integration tests were missing or wrongly validated for that module 
- e2e/Regression suites needs to be updated to accommodate possible fix in feature
- Retesting and small regression around that feature is required

Considering the above points
- Development team may have to re-think the feature and rework on Analysis and Development
- It may be difficult to find the devs who might have developed the feature/story. They might have a new story to work upon. They may also take up some time to switch between the stories and tasks.
- If a new dev signs up for it then context sharing will be required.
- The same Development-QA cycle will start. 

I am now looking at those above points a bit more seriously. Few gaps come to my mind.
- QAs were not involved in requirement/feature refinement and consultation: If done so posible requirement defects detected post development might have been solved earlier
- `Test pyramid` is not effectively followed. Edge cases and data critical scenarios were missed. YOU (devs/QAs) should have written/validated tests on  Unit/Integration test layers. This would have reduced defects to be slipped on later stages of SDLC.
- Overall development and testing `re-work` would have been avoided.

## How to focus more on Defect Prevention 
QAs should perform Quality checks right from the `beginning` of Requirement gathering and refinement. QAs should wear an `end user` hat and should `consult` on how they would imagine a feature to be. What might help them and what may cause confusion or might not work.
Once a feature is well groomed and ACs are finalized it becomes very rare to find any issue related to this on later stages of SDLC.

QAs along with BA and dev should clear out things and agree on the ACs and tech approach `before` devs pick up the story for development. YOU can call this check as `STORY KICKOFF`. 

Next stage for QAs to be `continuously` involved with developers while they are working on the story to ensure they are following the
- good code quality: code should be clear enough for others so that future modifications can be made easily.
- code/framework should be capable enough to accomodate any future enhancements 
- unit/integration test coverage: QAs should not only focus on code coverage overall %. Sometimes data permutation and combination on the same code can cause issues on feature. 
- Look for an opportunity where you can pick up the `early validation` for fast feedback.

Once dev work is done and ready to be deployed YOU all three (QAs, BAs and Devs) should come together. In this connection you all go through the ACs and validate the feature. Here it becomes very easy to accommodate any feedback and validate the outcome to finalize the decision and approach. You can call this connection as `devbox`. I have seen people using other names as well like `desk check` and `volleyball` for this kind of connect and precheck.

Once all satisfied, dev changes are now ready to be deployed on env and becomes ready for you (QAs) for the exploratory testing.
- filter out what really is needed to be part of Automated UI end to end test suites. YOU should not cover everything on this layer.
- Take leverage of API tests and validate various business use cases in this layer.

Now you can try to imagine the confidence level over the feature. QAs effort will be reduced drastically and you will get ample amount of time to break the application on edge cases.

There is one more thing you can try out before regression testing. Before Regression, bring up everyone from the team and ask them to test the application for any possible defects or break it all together. We call it Bug bash and trust me , it will work wonders to find out issues that would not have been discovered by any other means.

![defect-prevention](https://user-images.githubusercontent.com/19272137/170416790-9ca64642-d90f-4845-927d-0c2ccec23c68.jpg)

> Its not like Defect detection is all bad and you should stop doing it. I am telling you to focus more on Defect prevention rather than detection. I personally follow the 80-20 split. where 80% of my effort goes to defect prevention and only 20% to defect detection (exploratory testing and bug bash).
> These things have helped me and my peers to avoid testing bottlenecks and a lot of teams rework. It also helped us to stick on our timeline and deliver the release on scheduled time. 

> What do you think about this? Did this writeup help you to change your perspective on testing ? 
    
> Happy Testing :)


