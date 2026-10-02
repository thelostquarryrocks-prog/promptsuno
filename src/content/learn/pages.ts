import type { LearnPage, LearnSource, MonkeyMethod } from "./types"

export const learnSources = {
  catalog: {
    id: "prompt-suno-catalog",
    title: "PromptSuno migrated style catalog v1",
    kind: "research",
    note: "Research snapshot dated September 27, 2026. A source-observed term is vocabulary evidence, not proof that Suno will follow it. No catalog item in these lessons was audio-tested by that research pass.",
  },
  customLyrics: {
    id: "suno-custom-lyrics",
    title: "Can I use my own lyrics?",
    href: "https://help.suno.com/en/articles/2415873",
    kind: "official",
    note: "Suno documents Custom mode as the place to enter original lyrics and additional creative context.",
  },
  glossary: {
    id: "suno-music-glossary",
    title: "Music Glossary for Suno",
    href: "https://help.suno.com/en/articles/9010177",
    kind: "official",
    note: "Suno publishes musical vocabulary and examples for describing tempo, structure, vocals, instrumentation, and production.",
  },
  sliders: {
    id: "suno-creative-sliders",
    title: "How to Use: Creative Sliders",
    href: "https://help.suno.com/en/articles/6141377",
    kind: "official",
    note: "Suno documents Weirdness and Style Influence as adjustable controls in Custom mode.",
  },
  exclude: {
    id: "suno-exclude",
    title: "How do I exclude elements of a song?",
    href: "https://help.suno.com/en/articles/3161921",
    kind: "official",
    note: "Suno documents Exclude under Advanced Options for instruments and other unwanted elements.",
  },
  personas: {
    id: "suno-personas",
    title: "What are Personas?",
    href: "https://help.suno.com/en/articles/3484161",
    kind: "official",
    note: "Suno documents Personas as a way to reuse a song's vocal and style character in Custom mode.",
  },
  editor: {
    id: "suno-song-editor",
    title: "How to Use: Song Editor",
    href: "https://help.suno.com/en/articles/6141505",
    kind: "official",
    note: "Suno documents section movement, replacement, lyric edits, extension, crop, and fades in the Song Editor.",
  },
  replace: {
    id: "suno-replace-section",
    title: "Can I replace a section of a song?",
    href: "https://help.suno.com/en/articles/3271873",
    kind: "official",
    note: "Suno documents Replace Section as a Pro/Premier editing feature that generates alternatives and a new whole-song version.",
  },
  extend: {
    id: "suno-extend",
    title: "How do I make my song longer?",
    href: "https://help.suno.com/en/articles/2409601",
    kind: "official",
    note: "Suno documents Extend as a way to keep part of a song and generate a new continuation or ending.",
  },
} satisfies Record<string, LearnSource>

const styleMonkey: MonkeyMethod = {
  id: "style-three-lanes",
  title: "The three-lane prompt",
  summary: "Give the model a musical destination without micromanaging the route.",
  kind: "static",
  tips: [
    "Use one lane for musical identity, one for emotional or rhythmic character, and one for sonic detail. Example: nocturnal synth-pop · restrained pulse · close, breathy vocal.",
  ],
}

const structureMonkey: MonkeyMethod = {
  id: "structure-energy-map",
  title: "Map energy before labels",
  summary: "A section name is useful; its job in the song is more useful.",
  kind: "static",
  tips: [
    "Sketch the energy path in plain language first: intimate opening → lift → largest hook → reset → final lift. Then choose section labels that support that path.",
  ],
}

const vocalMonkey: MonkeyMethod = {
  id: "vocal-performance-note",
  title: "Write a performance note",
  summary: "Describe what the singer is doing, not an identity you cannot control.",
  kind: "static",
  tips: [
    "Pair vocal character with delivery and mix position: warm low register, restrained delivery, close and forward in the mix. Treat the result as a direction, not a casting guarantee.",
  ],
}

const lyricsMonkey: MonkeyMethod = {
  id: "lyrics-singability-pass",
  title: "Read it on the beat",
  summary: "Your mouth catches crowding before your screen does.",
  kind: "static",
  tips: [
    "Speak each line over a steady tap. Shorten the places where you rush, and give the hook the simplest vowel sounds and clearest stress pattern.",
  ],
}

const editingMonkey: MonkeyMethod = {
  id: "editing-smallest-fix",
  title: "Fix the smallest region",
  summary: "Keep the good take intact whenever the tool allows it.",
  kind: "static",
  tips: [
    "Name the failure, choose the narrowest edit that can address it, and compare the new transition in context. A full regeneration creates more variables than a section repair.",
  ],
}

export const learnPages = [
  {
    slug: "style-prompts",
    number: "01",
    title: "Write clearer style prompts",
    shortTitle: "Style prompts",
    description: "Turn a vague vibe into a concise, testable musical direction without pretending prompt grammar is deterministic.",
    question: "How do I write a better Suno style prompt?",
    readTime: "6 min",
    accent: "violet",
    blocks: [
      {
        type: "fast-answer",
        title: "Start with three useful decisions",
        body: "Name the musical identity, the motion or mood, and two or three audible details. Keep the first attempt compact enough that you can tell what changed on the next one.",
        points: [
          "Identity: genre, era, or broad arrangement",
          "Character: mood, energy, groove, or tempo feel",
          "Detail: instruments, vocal delivery, texture, or production",
        ],
      },
      {
        type: "why",
        title: "Why it matters",
        body: [
          "A list of every attractive idea can pull in competing directions. A shorter prompt gives you a clearer hypothesis to test.",
          "Suno documents musical terms you can try and a Style Influence control, but that is not a deterministic grammar. Results vary by model, seed, lyrics, and the rest of the creation settings.",
        ],
      },
      {
        type: "workflow",
        title: "Build the prompt in one pass",
        steps: [
          { title: "Choose the anchor", body: "Start with the broad identity: for example, nocturnal synth-pop or acoustic soul ballad." },
          { title: "Add motion", body: "Describe energy or feel: restrained pulse, driving shuffle, gradual crescendo, or spacious and slow." },
          { title: "Add audible detail", body: "Pick a small number of elements you could recognize by listening: muted drum machine, glassy synths, close vocal." },
          { title: "Remove contradictions", body: "If two phrases fight for the same role, choose the one that matters more for this generation." },
          { title: "Test one change", body: "Keep the lyrics and most settings steady, change one prompt idea, then compare both outputs." },
        ],
      },
      {
        type: "comparison",
        title: "Before and after",
        before: { label: "Too broad", text: "Epic beautiful emotional modern retro pop rock electronic cinematic hit" },
        after: { label: "Clearer direction", text: "Nocturnal synth-pop, restrained mid-tempo pulse, glassy arpeggios, warm bass, close breathy lead vocal" },
        takeaway: "The second prompt is not magic syntax. It is simply easier to hear, revise, and compare.",
      },
      { type: "monkey-method", method: styleMonkey },
      {
        type: "mistakes",
        title: "Common misses",
        items: [
          { title: "Keyword stacking", fix: "Keep only the descriptors that change an audible decision." },
          { title: "Using artist names as shortcuts", fix: "Describe the musical qualities you want instead; names can be moderated and are less informative." },
          { title: "Treating order or punctuation as code", fix: "Use readable phrases. If order seems to help, treat it as an experiment, not a guaranteed parser rule." },
          { title: "Trying to negate inside the style prompt", fix: "Suno documents a separate Exclude control under Advanced Options; use it when available." },
        ],
      },
      {
        type: "advanced",
        title: "When the basics are working",
        intro: "Add control gradually and keep listening as the final judge.",
        items: [
          { title: "Separate composition from production", body: "A chordal or rhythmic request shapes the writing; mix terms such as close, wide, dry, or saturated shape presentation. Change one layer at a time." },
          { title: "Use sliders as separate controls", body: "Suno documents Weirdness and Style Influence. They interact with your text, but do not turn it into a precise specification." },
          { title: "Keep a tiny test log", body: "Save the prompt, model, important settings, and what you heard. Two careful comparisons teach more than ten untracked generations." },
        ],
      },
      {
        type: "caveat",
        tone: "warning",
        title: "Precision has a ceiling",
        body: "Exact BPM, meter, instrument entrance, punctuation, brackets, numeric weights, and descriptor order may influence results in some contexts, but PromptSuno does not present them as guaranteed controls without repeatable evidence.",
      },
    ],
    sources: [learnSources.glossary, learnSources.sliders, learnSources.exclude, learnSources.catalog],
    related: ["vocals", "song-structure", "editing"],
    actions: [
      { pillar: "build", title: "Build from this direction", description: "Carry a concise style brief into the PromptSuno workspace.", href: "/workspace?tool=build&from=learn-style-prompts" },
      { pillar: "fix", title: "Diagnose a muddy prompt", description: "Open the troubleshooting handoff with this lesson as context.", href: "/workspace?tool=fix&from=learn-style-prompts" },
    ],
  },
  {
    slug: "song-structure",
    number: "02",
    title: "Shape a song that goes somewhere",
    shortTitle: "Song structure",
    description: "Plan contrast, repetition, and energy before asking section labels to do all the work.",
    question: "How should I describe song structure in Suno?",
    readTime: "7 min",
    accent: "cyan",
    blocks: [
      {
        type: "fast-answer",
        title: "Describe the journey, then the sections",
        body: "Choose a simple energy arc and give each section one job. Use familiar labels such as verse, chorus, pre-chorus, bridge, intro, and outro when they clarify that job.",
        points: ["Verse: move the story or idea", "Chorus: deliver the central hook", "Bridge: create meaningful contrast", "Outro: resolve, transform, or deliberately leave tension"],
      },
      {
        type: "why",
        title: "Structure is controlled contrast",
        body: [
          "Listeners recognize return because something changed before it. A louder chorus matters more after a restrained verse; a bridge earns its place by revealing a new angle.",
          "Suno's glossary documents common structural vocabulary. PromptSuno's migrated catalog also records verse, chorus, and bridge as official vocabulary, while warning that a section label is not a guaranteed parser command.",
        ],
      },
      {
        type: "workflow",
        title: "Sketch a useful form",
        steps: [
          { title: "Write the promise", body: "Finish this sentence: by the end, the song should feel like…" },
          { title: "Draw the energy line", body: "Use four or five plain-language moments: small → rising → open → surprising → resolved." },
          { title: "Assign section jobs", body: "Map verse, chorus, bridge, or instrumental space only where each label helps the journey." },
          { title: "Mark one contrast per transition", body: "Change density, register, rhythm, harmony, vocal intensity, or instrumentation—not everything at once." },
          { title: "Listen for the return", body: "If the chorus does not feel bigger or clearer on return, strengthen the setup before adding more sections." },
        ],
      },
      {
        type: "example",
        title: "A compact structure brief",
        label: "Energy-first outline",
        prompt: "Short atmospheric intro; intimate verse with sparse drums; pre-chorus adds motion; wide melodic chorus; second verse keeps the pulse; contrasting half-time bridge; final chorus with fuller harmonies; clean unresolved outro.",
        explanation: "This outline combines section vocabulary with audible function. Exact timing and compliance can still vary.",
      },
      { type: "monkey-method", method: structureMonkey },
      {
        type: "mistakes",
        title: "Common failure cases",
        items: [
          { title: "Every section is maximal", fix: "Reserve at least one dimension—density, register, or vocal intensity—for the peak." },
          { title: "The bridge is another verse", fix: "Give it one strong contrast: perspective, harmony, rhythm, or instrumentation." },
          { title: "Labels without lyrical fit", fix: "Match line count and idea density to the role of the section." },
          { title: "Demanding bar-perfect execution", fix: "Treat exact bar counts, tempo changes, and timed entrances as targets to verify by listening, not guarantees." },
        ],
      },
      {
        type: "advanced",
        title: "Advanced considerations",
        intro: "Once the large shape works, refine the transitions.",
        items: [
          { title: "Carry one motif across sections", body: "A repeated rhythm, image, or melodic contour can create unity even when the arrangement changes." },
          { title: "Write into the transition", body: "The final line of a verse can create the question that the chorus answers. Structure is lyrical as well as musical." },
          { title: "Edit the local problem", body: "When one transition fails, use the narrowest available editing tool rather than regenerating a working full song." },
        ],
      },
      {
        type: "caveat",
        tone: "note",
        title: "Section labels are guidance",
        body: "Bracketed or named sections are useful organization and commonly observed vocabulary. They do not guarantee exact placement, duration, or instrumentation in a generated performance.",
      },
    ],
    sources: [learnSources.glossary, learnSources.editor, learnSources.catalog],
    related: ["lyrics", "style-prompts", "editing"],
    actions: [
      { pillar: "build", title: "Build with an energy map", description: "Bring the section jobs into a new prompt workspace.", href: "/workspace?tool=build&from=learn-song-structure" },
      { pillar: "fix", title: "Fix a flat arrangement", description: "Carry the transition you are diagnosing into FIX.", href: "/workspace?tool=fix&from=learn-song-structure" },
    ],
  },
  {
    slug: "vocals",
    number: "03",
    title: "Describe the vocal performance",
    shortTitle: "Vocals",
    description: "Ask for range, delivery, texture, and mix role without turning a direction into a guarantee.",
    question: "How do I get closer to the vocal sound I want?",
    readTime: "6 min",
    accent: "amber",
    blocks: [
      {
        type: "fast-answer",
        title: "Describe a performance, not just a singer",
        body: "Combine register or range, delivery, texture, and placement in the arrangement. Use only the dimensions that matter to the song.",
        points: ["Register: low, mid, high, falsetto", "Delivery: restrained, conversational, belted, rhythmic", "Texture: airy, clear, raspy, warm", "Role: intimate lead, stacked harmony, distant response"],
      },
      {
        type: "why",
        title: "Why vocal prompts drift",
        body: [
          "Words such as powerful or emotional are broad. Two listeners—and two generations—can interpret them differently. Audible performance notes give you a better comparison point.",
          "The migrated PromptSuno catalog records male and female vocal terms as source-observed vocabulary, but none of its terms were audio-tested. It also contains curated additions such as whispered vocals and vocal harmonies; those are ideas to try, not verified controls.",
        ],
      },
      {
        type: "workflow",
        title: "Write a vocal brief",
        steps: [
          { title: "Choose the song role", body: "Decide whether the voice should lead, blend, answer, narrate, or act as texture." },
          { title: "Set the delivery", body: "Name the physical action: clipped phrases, long legato lines, restrained delivery, controlled belt." },
          { title: "Add one texture", body: "Choose a useful quality such as clear, breathy, smoky, grainy, or bright." },
          { title: "Place it in the mix", body: "Try close and dry, wide and layered, distant and reverberant, or forward over sparse backing." },
          { title: "Check the lyrics", body: "Dense consonants and crowded syllables can fight a slow, sustained delivery." },
        ],
      },
      {
        type: "comparison",
        title: "Make the note audible",
        before: { label: "Vague", text: "Emotional female vocals" },
        after: { label: "Testable", text: "Warm mid-range lead, restrained verses, open sustained chorus, close and forward in the mix" },
        takeaway: "The revised version describes changes you can listen for. Gendered terms may still be used, but they do not guarantee a specific voice identity.",
      },
      { type: "monkey-method", method: vocalMonkey },
      {
        type: "mistakes",
        title: "Common misses",
        items: [
          { title: "Conflicting delivery notes", fix: "Assign contrast by section instead of asking for intimate, huge, whispered, and belted at once." },
          { title: "Ignoring lyric density", fix: "Shorten crowded lines or choose a more speech-like delivery." },
          { title: "Expecting an exact identity", fix: "Treat vocal descriptors as performance direction. Do not promise exact timbre, accent, range, or identity." },
          { title: "Changing everything after one miss", fix: "Keep the song brief stable and revise one vocal dimension." },
        ],
      },
      {
        type: "advanced",
        title: "Consistency and variation",
        intro: "Use product features when they match the job, and keep their limits visible.",
        items: [
          { title: "Persona for continuity", body: "Suno documents Personas as a way to reuse a song's vocal and style character. That can improve continuity, but it is not exact cloning." },
          { title: "Harmony as arrangement", body: "Specify where harmonies enter and what they do: narrow doubles in the pre-chorus, wider stacked responses in the final chorus." },
          { title: "Separate performance from polish", body: "If the delivery is right but the balance is wrong, try an editing or remastering path rather than rewriting the performance brief." },
        ],
      },
      {
        type: "caveat",
        tone: "warning",
        title: "No descriptor guarantees a voice",
        body: "Vocal range, accent, pronunciation, identity, and section-by-section delivery can vary. Verify by listening and protect the rights and consent of real performers.",
      },
    ],
    sources: [learnSources.glossary, learnSources.personas, learnSources.catalog],
    related: ["lyrics", "style-prompts", "editing"],
    actions: [
      { pillar: "build", title: "Build with a vocal brief", description: "Carry the performance note into the prompt workspace.", href: "/workspace?tool=build&from=learn-vocals" },
      { pillar: "fix", title: "Troubleshoot vocal drift", description: "Open FIX with the vocal dimension you want to isolate.", href: "/workspace?tool=fix&from=learn-vocals" },
    ],
  },
  {
    slug: "lyrics",
    number: "04",
    title: "Write lyrics that leave room for music",
    shortTitle: "Lyrics",
    description: "Build a singable hook, control line density, and organize sections without treating brackets as code.",
    question: "How do I make my lyrics work better in a generated song?",
    readTime: "7 min",
    accent: "rose",
    blocks: [
      {
        type: "fast-answer",
        title: "Simplify the hook and shape the breath",
        body: "Give each section one idea, keep line lengths intentional, and make the chorus easier to remember than the verse. Read the lyric aloud before generating.",
        points: ["One central image or claim per section", "Fewer syllables where notes need to stretch", "A hook that survives without the rhyme around it", "Clear section breaks for humans and the model"],
      },
      {
        type: "why",
        title: "Lyrics are also performance instructions",
        body: [
          "Line length, punctuation, consonant density, repetition, and section shape affect how a singer can phrase the words—even when the generator does not follow them exactly.",
          "Suno documents that Custom mode accepts your own lyrics. It does not document a deterministic bracket language, so section labels should remain readable structural guidance rather than secret syntax.",
        ],
      },
      {
        type: "workflow",
        title: "Draft for the ear",
        steps: [
          { title: "Write the chorus claim", body: "Say the song's central feeling or change in one plain sentence." },
          { title: "Find the hook", body: "Reduce that sentence to the phrase a listener could repeat after one pass." },
          { title: "Give verses new information", body: "Each verse should change the scene, stakes, or interpretation—not paraphrase the chorus." },
          { title: "Read on a pulse", body: "Tap a steady beat and notice where syllables bunch up or stresses land unnaturally." },
          { title: "Label for navigation", body: "Use familiar section names to make the lyric easy to scan. Keep extra instructions short and musical." },
        ],
      },
      {
        type: "example",
        title: "A singable contrast",
        label: "Verse into chorus",
        prompt: "[Verse]\nStreetlight on the dashboard\nYour name under my breath\nEvery mile keeps asking\nWhat I haven't answered yet\n\n[Chorus]\nLeave a light on\nLeave a light on\nI am closer than I was",
        explanation: "The verse carries detail; the chorus spends fewer words on a repeatable emotional center. The labels organize the page but do not guarantee an exact musical form.",
      },
      { type: "monkey-method", method: lyricsMonkey },
      {
        type: "mistakes",
        title: "Common failure cases",
        items: [
          { title: "Every line explains", fix: "Replace one explanation with an image, action, or object the listener can picture." },
          { title: "The chorus is denser than the verse", fix: "Remove setup language and protect the simplest repeatable phrase." },
          { title: "Rhyme drives the meaning", fix: "Keep the emotional sentence first; change the rhyme before changing what the song means." },
          { title: "Too many stage directions", fix: "Move global sound decisions to the style prompt and keep section notes brief." },
        ],
      },
      {
        type: "advanced",
        title: "Advanced considerations",
        intro: "Once the lyric sings cleanly, use form and sound to deepen it.",
        items: [
          { title: "Vary repetition", body: "Let a repeated hook change meaning because the verse before it changed the context." },
          { title: "Write vowels for the peak", body: "Open vowel sounds are often easier to sustain. Test the words aloud rather than forcing a rule onto every melody." },
          { title: "Protect authorship", body: "Use lyrics you have the right to use. Suno states that you retain rights to original lyrics you enter; other creators' lyrics still require permission." },
        ],
      },
      {
        type: "caveat",
        tone: "note",
        title: "Expect interpretation",
        body: "The generated singer may repeat, omit, mispronounce, or rephrase the intended delivery. Preserve your original lyric and compare outputs before editing the source text around one unusual take.",
      },
    ],
    sources: [learnSources.customLyrics, learnSources.glossary, learnSources.catalog],
    related: ["song-structure", "vocals", "editing"],
    actions: [
      { pillar: "build", title: "Build around this lyric", description: "Take the hook and section map into BUILD.", href: "/workspace?tool=build&from=learn-lyrics" },
      { pillar: "fix", title: "Fix a crowded section", description: "Carry a lyric failure case into the troubleshooting handoff.", href: "/workspace?tool=fix&from=learn-lyrics" },
    ],
  },
  {
    slug: "editing",
    number: "05",
    title: "Choose the smallest useful edit",
    shortTitle: "Editing",
    description: "Match the failure to Replace, Extend, Reuse Prompt, or a new generation before changing a working song.",
    question: "Which Suno editing path should I try first?",
    readTime: "8 min",
    accent: "lime",
    blocks: [
      {
        type: "fast-answer",
        title: "Name the failure before choosing the tool",
        body: "Keep the strongest take and change the smallest region that can solve the problem. Use a new full generation only when the problem is global.",
        points: ["One bad region: Replace Section", "Wrong or missing ending: Extend", "Good brief, new full take: Reuse Prompt", "Global direction is wrong: revise the brief and regenerate"],
      },
      {
        type: "why",
        title: "Editing is variable control",
        body: [
          "A full regeneration can change performance, arrangement, pronunciation, balance, and structure at once. That may be useful exploration, but it is a poor diagnostic move when one transition is the problem.",
          "Suno documents section replacement, lyric edits, extension, crop, fades, and timeline changes. Some tools and availability depend on plan, model, or product version.",
        ],
      },
      {
        type: "workflow",
        title: "Run a focused repair",
        steps: [
          { title: "Write the failure in one sentence", body: "Example: the second chorus loses energy because the drums thin out too early." },
          { title: "Mark the smallest region", body: "Include enough lead-in and tail for a natural transition, but avoid replacing working audio." },
          { title: "Make one directional request", body: "Ask for the missing musical change, not a complete restatement of the song." },
          { title: "Compare in context", body: "Listen before, through, and after the edit. A good isolated clip can still make a bad transition." },
          { title: "Keep a reversible favorite", body: "Do not discard the strongest whole-song version while auditioning alternatives." },
        ],
      },
      {
        type: "example",
        title: "Turn a complaint into an edit brief",
        label: "Focused request",
        prompt: "Replace only the final pre-chorus. Keep the restrained vocal tone; add a rising tom pattern and wider harmony in the last two lines so the chorus entrance feels earned.",
        explanation: "The request names the region, preserves what works, and asks for two audible changes. The result still needs transition testing.",
      },
      { type: "monkey-method", method: editingMonkey },
      {
        type: "mistakes",
        title: "Common editing traps",
        items: [
          { title: "Repairing before diagnosing", fix: "Separate lyric, performance, arrangement, transition, and mix problems first." },
          { title: "Selecting too little context", fix: "Give the generated region enough boundary audio to form a believable handoff." },
          { title: "Changing lyrics and arrangement together", fix: "When possible, isolate the variable so you know what helped." },
          { title: "Assuming the new take is better", fix: "Compare the full-song flow, not only the edited region in isolation." },
        ],
      },
      {
        type: "advanced",
        title: "Match the tool to the scale",
        intro: "Use the least disruptive operation that addresses the actual problem.",
        items: [
          { title: "Replace Section", body: "Suno documents it for changing a middle region or its lyrics, producing alternatives that can become a new whole-song version." },
          { title: "Extend", body: "Use it when the ending or continuation is the problem. Choose the handoff point carefully and judge the stitched song." },
          { title: "Reuse Prompt", body: "Use it when the inputs are mostly right but you want a fresh complete performance or need to revise the full brief." },
          { title: "Song Editor", body: "Use timeline operations for arrangement changes such as moving, splitting, cropping, fading, or adding sections when those controls are available." },
        ],
      },
      {
        type: "caveat",
        tone: "warning",
        title: "Availability changes",
        body: "Editing features can depend on subscription, model, surface, and rollout. Check the current Suno interface and help documentation before promising a specific operation to a user.",
      },
    ],
    sources: [learnSources.editor, learnSources.replace, learnSources.extend],
    related: ["song-structure", "lyrics", "style-prompts"],
    actions: [
      { pillar: "build", title: "Rebuild the global direction", description: "Use BUILD when the full creative brief needs to change.", href: "/workspace?tool=build&from=learn-editing" },
      { pillar: "fix", title: "Diagnose the smallest repair", description: "Open FIX with a one-sentence failure and bounded region.", href: "/workspace?tool=fix&from=learn-editing" },
    ],
  },
] as const satisfies readonly LearnPage[]

export type LearnSlug = (typeof learnPages)[number]["slug"]

export const learnPageMap = new Map<string, LearnPage>(
  learnPages.map((page) => [page.slug, page]),
)

export const rotatingLearnTips: MonkeyMethod = {
  id: "learn-index-rotation",
  title: "A small idea for the next generation",
  summary: "Optional coaching, one useful move at a time.",
  kind: "rotating",
  tips: [
    "Change one prompt dimension per comparison. You will learn more from the difference.",
    "Describe what a section should do before deciding what to call it.",
    "If a lyric is hard to say on a steady tap, it will probably be hard to sing clearly.",
    "Keep the strongest take while you edit. Exploration should not erase a good checkpoint.",
    "Use audible words: close, sparse, rising, clipped, wide. Then verify by listening.",
  ],
}
