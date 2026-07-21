# tactiq.io free youtube transcript
# What AI Agent Skills Are and How They Work
# https://www.youtube.com/watch/Lg-meK5IU8Q

00:00:00.320 What are AI agent skills and why have they become an open
00:00:04.400 standard adopted by practically every major AI coding platform?
00:00:09.040 Well, because skills address a specific problem with agents.
00:00:14.880 Now AI agents, they're pretty good reasoners and
00:00:19.760 LLMs or large language models already know a lot of facts.
00:00:24.880 They can tell you about Kubernetes architecture or the the history of SQL
00:00:30.000 or the airspeed velocity of an unladen swallow, that part is covered but they lack something.
00:00:36.880 They lack procedural knowledge.
00:00:41.280 The stuff that's specific to how work actually gets done,
00:00:47.120 like let's say a 47-step workflow for generating a compliant financial report.
00:00:57.200 Yeah, that would be fun.
00:00:59.920 An AI agent that is running a large language model when it
00:01:06.240 encounters a task like generating this report, it basically has two options.
00:01:12.880 Either somebody needs to prompt it with every single step, all 47 of them, and they need
00:01:20.000 to do that every time, or worse still, the agent is just going to take a guess at it.
00:01:26.720 Now a skill is how you actually add in that procedural knowledge
00:01:34.720 into the agent and the format of a skill is almost comically simple.
00:01:41.840 It's simply a skill.md file.
00:01:46.880 That's a markdown file in a folder.
00:01:50.480 So let me draw out what a skill actually looks like.
00:01:55.200 So at the top.
00:01:58.480 Skill.md file is some YAML front letter.
00:02:04.240 So let's have a look at what is defined in the front letter?
00:02:09.919 Well, at a minimum, there are two things.
00:02:13.360 So there is a name and there is description.
00:02:21.680 These are the two mandatory fields.
00:02:24.720 Now the name identifies the skill,
00:02:28.480 the description that tells the agent what this skill does and when it should be used.
00:02:35.120 Now this description is pretty important because it's the trigger condition that
00:02:42.400 tells agent exactly when this skill applies, so maybe the skill name is PDF Builder.
00:02:50.080 And the description here that says something like, use this when the user asks to extract a PDF.
00:02:57.120 Now there are some other fields you can put into the front matter like author and version,
00:03:02.160 but it's name and description that are mandatory.
00:03:05.200 Now below the front mater, we also have a field.
00:03:12.640 Now these are the actual instructions.
00:03:16.240 These are the step-by-step workflows, the rules, the examples of input and output,
00:03:20.560 whatever the agent needs to know to do the job.
00:03:23.440 And it's just written in plain markdown.
00:03:27.040 And then the skill folder can contain some optional folders as well.
00:03:32.640 So you don't have to have these, but you can add them.
00:03:36.240 One of those optional folders is the scripts.
00:03:42.640 And this has executable JavaScript or Python or bash that the agent can actually run.
00:03:51.120 There's also a references directory that contains additional documentation that
00:03:58.480 gets loaded if the agent determines it needs it.
00:04:02.240 And finally, the other optional directory is the assets directory
00:04:07.680 that contains static resources like templates and data files.
00:04:12.880 That's what an agent skill looks like, but agents can have lots of skills defined for them.
00:04:20.640 So what happens when there are like hundreds of these skills?
00:04:25.680 Loading all of them into the LLM context window at startup would
00:04:29.840 blow through the token budget before anyone even gets to ask a question.
00:04:34.640 So skills use something called progressive disclosure.
00:04:41.840 And progressive disclosure works in three tiers.
00:04:46.080 So tier one is metadata only, and that applies.
00:04:53.360 So at startup, the agent loads just the name and description from each skill.
00:04:58.720 So that's just a handful of tokens per skill.
00:05:01.760 So even if there are a hundred skills installed, the overhead isn't gonna fill the context window.
00:05:07.760 And this is kind of essentially akin to a skills table of contents.
00:05:12.240 Now tier two, this relates to the full instructions.
00:05:17.440 When the agent sees a request that matches this skill's description,
00:05:21.520 it reads the complete skill.md body into context.
00:05:26.640 And this tells the agent what to do, the skill we are teaching it.
00:05:31.600 And that identification, the matching of a given requirement for a task to
00:05:36.960 the skill available is something that happens through the LLM's own reasoning.
00:05:41.600 The model decides when it can make use of the skill,
00:05:45.280 which is why a good skill description is so important.
00:05:50.320 Then tier three, that's these optional folders here.
00:05:54.480 So these are the resources that maps to the scripts and references and the assets folders.
00:06:00.240 And they only get loaded when a specific task actually needs them.
00:06:04.400 So the agent starts with a lightweight index of everything it can do.
00:06:09.040 That's the name and description.
00:06:11.120 It pulls in the detailed instructions when they're relevant, the body,
00:06:15.760 based on matching the trigger condition.
00:06:18.160 And it grabs resources only at the point of need.
00:06:21.920 Now skills bring a type of knowledge to agents.
00:06:26.240 There are several ways to incorporate knowledge into an agent.
00:06:28.720 So let's just briefly compare them because they handle different things.
00:06:34.560 And the first one I just want to mention is MCP.
00:06:39.120 That's Model Context Protocol.
00:06:42.240 What sort of knowledge does MCP give you?
00:06:45.280 Gives you tool access.
00:06:47.200 It gives agents the ability to call out to external APIs and to interact with services.
00:06:53.440 MCP is about what the agent can reach,
00:06:57.120 but it doesn't tell the agent when to reach for it or what to do once it has.
00:07:03.120 So that's MCP.
00:07:04.720 Another one is RAG, Retrieval Augmented Generation,
00:07:10.240 and RAG that handles factual knowledge, so it pulls in...
00:07:15.120 Relevant chunks from our knowledge database at run time,
00:07:18.000 which is pretty handy when the agent needs to look something up.
00:07:22.000 But RAG doesn't teach an agent how to do something.
00:07:24.960 It's reference material.
00:07:27.520 What about another one?
00:07:28.720 How about fine tuning?
00:07:32.240 What can that do for us?
00:07:33.680 Well, fine tuning bakes knowledge directly into the model's weights.
00:07:40.560 Now that's something that's permanent, but it's expensive.
00:07:43.040 And if the model changes the fine-tuning has to be redone.
00:07:46.880 Now skills don't really do any of this so what knowledge do skills bring to agents?
00:07:58.080 Well skills handle as I mentioned right up front procedural knowledge.
00:08:05.440 It's how to do things in what order and with what judgment,
00:08:10.800 and because they just files Well, they can be version control,
00:08:14.800 they could be easily updated and you can easily move them between platforms.
00:08:19.360 Now, in practice, skills will often use some of these other
00:08:24.080 forms of knowledge like, well, MCP for example.
00:08:27.680 So MCP provides the capability to invoke something
00:08:31.840 externally and the skill provides the judgment for when and how to do that.
00:08:37.679 Now, one more thing to say about skills.
00:08:41.200 Is that the skill.md format is an open standard,
00:08:45.840 and it's published at agent skills.io and that's an Apache 2.0 license project,
00:08:56.880 and it was adopted across a bunch of AI platforms
00:09:00.480 like Claude Code and OpenAI Codex and many other tools.
00:09:05.040 So a skill built for one platform works on any platform that supports this spec.
00:09:11.280 Now there's a useful way to think about skills and it comes from cognitive science.
00:09:16.160 Now humans have distinct types of memory.
00:09:19.520 There's semantic memory, which are facts.
00:09:22.720 So Rome is the capital of Italy.
00:09:25.840 There's episodic memory, which are experiences.
00:09:29.920 So, uh, I went to Rome last summer.
00:09:33.040 Actually I did, and it was lovely.
00:09:35.200 Uh, and then there's procedural memory, which are skills like how to ride a scooter on the
00:09:41.520 streets of Rome and live to tell the tale, which I also did barely.
00:09:47.200 Now agent architectures are starting to mirror this.
00:09:52.640 So semantic memory, that maps pretty closely to retrieval,
00:09:59.120 augmented generation and knowledge bases.
00:10:02.400 Episodic memory.
00:10:03.680 Well, that really maps to conversational.
00:10:08.080 Logs and interaction history and procedural memory.
00:10:12.640 Well, yep, that maps quite nicely to skill files.
00:10:20.480 Now, one thing that does need mentioning is that skills can include executable
00:10:29.280 scripts with access to file systems and environment variables and API keys.
00:10:37.040 That's what makes them powerful, but it's also what makes trust so important.
00:10:45.920 Because when an agent runs one of these scripts,
00:10:50.080 it's typically executing commands locally on your machine
00:10:53.760 and audits have found publicly available skills frequently
00:10:58.560 contain bad stuff like prompt injection, bad stuff
00:11:04.720 like tool poisoning, bad stuff like hidden malware.
00:11:10.240 Basically the usual suspects for any open ecosystem.
00:11:13.840 So, so treat skill installation the way that any responsible
00:11:18.320 team treats installing any software dependency,
00:11:21.600 which is to say, review it and understand what it does before using it on your local machine.
00:11:28.480 So, So where does this leave us?
00:11:30.560 Well, skills are procedural memory for AI agents.
00:11:34.640 They're defined in a markdown file that lives in a folder
00:11:38.480 that teaches an agent how to do a specific job.
00:11:42.960 Skills are conditionally triggered and they load efficiently through
00:11:48.080 progressive disclosure and the format is an open standard.
00:11:52.480 So an agent that already knows the airspeed velocity
00:11:56.240 of an unlaid and swallow, African and European,
00:11:59.600 can now also learn how to perform any repeatable task you define for it.
00:12:05.120 So that's AI agent skills.
00:12:07.360 If you're using them, let me know in the comments.
