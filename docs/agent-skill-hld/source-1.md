# tactiq.io free youtube transcript
# Intro to Agent Skills
# https://www.youtube.com/watch/4mnP1lRdUm8

00:00:00.240 AI progress moves at an incredible rate
00:00:02.720 and standards, best practices, and
00:00:04.799 techniques are constantly evolving.
00:00:06.879 Sometimes we make big leaps with the
00:00:08.720 models, but other times the tooling can
00:00:10.880 close critical gaps. We've moved away
00:00:13.280 from simple code completion to full
00:00:15.599 agentic driven chats. But we've hit a
00:00:18.000 wall, context bloat. You can't fit your
00:00:20.400 entire codebase into the context window
00:00:22.720 without confusing the model or wasting
00:00:24.560 tokens. Agent skills are a great way to
00:00:27.680 provide narrow and deep context for how
00:00:30.000 to do something, but allow the agent to
00:00:32.479 discover them only when they're needed.
00:00:34.880 Because they can be lazily loaded in,
00:00:37.120 you don't have to pay the cost of the
00:00:38.719 context bloat for the entire skill
00:00:40.800 definition if it's not relevant to the
00:00:42.559 task at hand. At its core, a skill is
00:00:44.960 simply a skill.md file in a named folder
00:00:47.840 inside the agent skills local or global
00:00:50.480 directory. The skill.md file is just a
00:00:53.199 markdown file with front matter that
00:00:55.280 includes the name and description that
00:00:56.879 the agent will use to see if the skill
00:00:59.120 makes sense to read in for the current
00:01:00.719 task. You can have global skills that
00:01:02.960 apply to the frameworks and languages
00:01:04.720 you work on and project specific skills
00:01:07.040 for libraries, SDKs, and frameworks
00:01:09.520 specific to the app or backend that
00:01:11.040 you're working on currently. A skill can
00:01:13.280 include other resources, scripts, code
00:01:15.600 examples, and other assets that are
00:01:17.280 needed. It makes it easy to colllocate
00:01:19.680 and distribute the skills with your team
00:01:21.520 and manage them on disk. You can find
00:01:23.920 skills in many popular repositories from
00:01:26.320 GitHub repos or even have the agent
00:01:28.240 generate them for you.
00:01:32.320 Let's walk through how to build custom
00:01:34.240 skills together. First, we can open
00:01:36.240 anti-gravity and create a new project in
00:01:38.240 the playground. Create a nested folder
00:01:40.880 called aagent/skills/html3danvas
00:01:45.119 and create a skill.md inside of it.
00:01:47.600 Inside the skillmd, we create triple
00:01:49.600 dashes to indicate the front matter
00:01:51.280 region and provide a YAML name and
00:01:53.360 description. We then can ask Gemini in
00:01:56.079 the agent chat to generate us a skill
00:01:57.840 for working with 3GS and V and how to
00:02:00.240 set up the resize listener as well as
00:02:02.000 the animation loop. We should also ask
00:02:04.880 for a skill for working with the new TSL
00:02:07.200 tiny shader language, which is a recent
00:02:09.360 addition to 3JS and may not be well
00:02:11.360 represented in the training data. After
00:02:13.599 it creates the skills, we then can start
00:02:15.440 a new chat and ask the agent to build us
00:02:17.520 a 3D solar system on the web. The agent
00:02:20.879 should come up with a plan and while
00:02:22.319 generating it should read the skills and
00:02:24.160 load them into context. Agents are
00:02:26.720 getting better with training data and
00:02:28.400 sometimes it'll be able to solve the
00:02:30.080 problem without skills. But by providing
00:02:32.720 the context, you can influence the
00:02:34.640 specific type and style of output that
00:02:36.720 you're going for and better convey the
00:02:38.879 intent for when you're asking for
00:02:40.560 various tasks. These can also be very
00:02:42.640 company and industry specific and you
00:02:44.640 will add more as your project grows. Now
00:02:46.800 that we have a project, we then can ask
00:02:48.560 the agent to create a skill for building
00:02:50.160 games with 3JS and another skill for
00:02:52.480 adding HTML guey that sits above the
00:02:54.640 canvas. After that is done, we can start
00:02:57.120 a new chat. We can ask the agent to
00:03:00.000 update our code and create a learning
00:03:01.760 based game for the solar system. Then we
00:03:04.319 can have a generated quiz and facts for
00:03:06.480 each planet that we click on. As it
00:03:08.319 generates, you should see it read in the
00:03:10.000 new skills that we created. And when it
00:03:12.080 is done, you can see if the game works.
00:03:17.040 When we decide to share this code with
00:03:18.879 others, this will load the project into
00:03:20.879 anti-gravity and the skills will be
00:03:22.720 discoverable for them, making
00:03:24.400 distributed knowledge possible, meaning
00:03:26.400 that they can have it colllocated with
00:03:28.000 the project. There are many places to
00:03:30.480 find skills and many tools that are
00:03:32.560 being created to make it easier. You can
00:03:34.720 use skills.sh sh to add any number of
00:03:37.200 skills for supported git repos. For
00:03:38.879 example, skills are an open standard and
00:03:41.360 you can check them out at
00:03:42.319 agentskills.io.
00:03:44.000 You can get started today with
00:03:45.120 anti-gravity and skills by downloading
00:03:47.200 the IDE and adding your favorite ones.
00:03:49.440 We'll include a link to some good skills
00:03:51.040 to check out in the description. Thanks
00:03:52.720 for watching and let us know how you're
00:03:54.480 using skills to level up your agentled
00:03:56.959 development. Thanks.


