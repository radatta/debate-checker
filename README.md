# Real-Time Debate Fact-Checking Platform

A Next.js 14 (React 18) application that transcribes live debates, detects factual claims, and uses the Perplexity API to verify statements in real time. Results are visualized for viewers and analysts, providing instant, transparent feedback on debate accuracy.

---

## Features

- **Live Speech-to-Text** : Real-time transcription of debate audio/video streams using OpenAI Whisper or Rev AI.
- **Claim Detection** : NLP-powered extraction of factual claims frfom transcripts.
- **AI Fact-Checking** : Each claim is sent to the Perplexity API for verification, with verdicts and evidence returned.
- **Real-Time Updates** : WebSocket-powered dashboard displays claims and verdicts as they happen.
- **Visual Analytics** : Interactive charts (D3.js/Visx) show claim timelines, sources, speaker stats, and topic breakdowns.
- **Persistent Storage** : PostgreSQL for debates, claims, verdicts; RedisJSON for real-time access.
- **Scalable Processing** : BullMQ (Redis) for distributed claim processing and retries.
- **Modern UI** : Built with Tailwind CSS and shadcn/ui for accessibility and speed.

---

## Tech Stack

- **Frontend** : Next.js 14 (App Router, React 18), TypeScript, Tailwind CSS, shadcn/ui, SWR/React Query, D3.js/Visx, Socket.io Client
- **Backend** : Node.js 18+, TypeScript, Next.js API Routes (Edge & Node), Socket.io Server, BullMQ, RedisJSON, Supabase (utilizing client and server modules within `src/lib/supabase` for database interactions, authentication, and real-time features), Perplexity API, Whisper/Rev AI, FFmpeg
- **DevOps** : Vercel, AWS Lambda/Google Cloud Functions, Cloudflare Workers, New Relic/Dynatrace, GitHub Actions, Docker, Sentry

---

## System Architecture

<pre class="not-prose w-full rounded font-mono text-sm font-extralight"><div class="codeWrapper text-textMainDark selection:!text-superDark selection:bg-superDuper/10 bg-offset dark:bg-offsetDark my-md relative flex flex-col rounded font-mono text-sm font-thin"><div class="translate-y-xs -translate-x-xs bottom-xl mb-xl sticky top-0 flex h-0 items-start justify-end"><button type="button" class="focus-visible:bg-offsetPlus dark:focus-visible:bg-offsetPlusDark hover:bg-offsetPlus text-textOff dark:text-textOffDark hover:text-textMain dark:hover:bg-offsetPlusDark dark:hover:text-textMainDark font-sans focus:outline-none outline-none outline-transparent transition duration-300 ease-out font-sans  select-none items-center relative group/button  justify-center text-center items-center rounded-full cursor-pointer active:scale-[0.97] active:duration-150 active:ease-outExpo origin-center whitespace-nowrap inline-flex text-sm h-8 aspect-square"><div class="flex items-center min-w-0 font-medium gap-1.5 justify-center"><div class="flex shrink-0 items-center justify-center size-4"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7999999999999998" stroke-linecap="round" stroke-linejoin="round" class="tabler-icon tabler-icon-copy "><path d="M7 7m0 2.667a2.667 2.667 0 0 1 2.667 -2.667h8.666a2.667 2.667 0 0 1 2.667 2.667v8.666a2.667 2.667 0 0 1 -2.667 2.667h-8.666a2.667 2.667 0 0 1 -2.667 -2.667z"></path><path d="M4.012 16.737a2.005 2.005 0 0 1 -1.012 -1.737v-10c0 -1.1 .9 -2 2 -2h10c.75 0 1.158 .385 1.5 1"></path></svg></div></div></button></div><div class="-mt-xl"><div><div class="text-text-200 bg-background-300 py-xs px-sm inline-block rounded-br rounded-tl-[3px] font-thin">text</div></div><div class="pr-lg"><span><code><span><span>graph TD
</span></span><span>    A[Audio/Video Stream] --> B[Transcription (Whisper/Rev AI)]
</span><span>    B --> C[Claim Detection (NLP)]
</span><span>    C --> D[Claim Queue (BullMQ/Redis)]
</span><span>    D --> E[Perplexity API Verification]
</span><span>    E --> F[Verdict & Evidence]
</span><span>    F --> G[WebSocket Server]
</span><span>    G --> H[Next.js Frontend Dashboard]
</span><span>    F --> I[Supabase/RedisJSON Storage]
</span><span>    H --> J[Data Visualization (D3.js/Visx)]
</span><span></span></code></span></div></div></div></pre>

---

## Development Plan

## Phase 1: Core Setup

- [ ] Scaffold Next.js 14 project with TypeScript, Tailwind, shadcn/ui.
- [ ] Set up Supabase and RedisJSON.
- [ ] Implement Socket.io server/client for real-time data.

## Phase 2: Live Transcription & Claim Detection

- [ ] Integrate Whisper/Rev AI for real-time transcription.
- [ ] Build claim detection module (regex + NLP).
- [ ] Store claims in PostgreSQL and RedisJSON.

## Phase 3: Fact-Checking Pipeline

- [ ] Integrate Perplexity API for claim verification.
- [ ] Use BullMQ for distributed, scalable claim processing.
- [ ] Return verdicts/evidence via Socket.io.

## Phase 4: Frontend & Visualization

- [ ] Build live dashboard for transcript, claims, verdicts.
- [ ] Implement D3.js/Visx charts for analytics.
- [ ] Add overlays for real-time claim status.

## Phase 5: Performance & Scaling

- [ ] Move endpoints to Next.js Edge Runtime.
- [ ] Deploy on Vercel, use Cloudflare Workers for edge logic.
- [ ] Set up AIOps monitoring and error tracking.

## Phase 6: Advanced Features

- [ ] Continuous claim re-evaluation as new evidence appears.
- [ ] User authentication (OAuth), role-based access.
- [ ] Audit trails and abuse prevention.

---

## Environment Variables

- `PPLX_KEY`: Perplexity API Key
- `SUPABASE_URL`: URL for your Supabase project
- `SUPABASE_ANON_KEY`: Publicly safe anonymous key for client-side Supabase access
- `SUPABASE_SERVICE_ROLE_KEY`: Secret service role key for server-side (admin) Supabase access
- `REDIS_URL`: Redis connection string
- `TRANSCRIBE_API_KEY`: Whisper/Rev AI API Key

---

## Example API Usage

<pre class="not-prose w-full rounded font-mono text-sm font-extralight"><div class="codeWrapper text-textMainDark selection:!text-superDark selection:bg-superDuper/10 bg-offset dark:bg-offsetDark my-md relative flex flex-col rounded font-mono text-sm font-thin"><div class="translate-y-xs -translate-x-xs bottom-xl mb-xl sticky top-0 flex h-0 items-start justify-end"><button type="button" class="focus-visible:bg-offsetPlus dark:focus-visible:bg-offsetPlusDark hover:bg-offsetPlus text-textOff dark:text-textOffDark hover:text-textMain dark:hover:bg-offsetPlusDark dark:hover:text-textMainDark font-sans focus:outline-none outline-none outline-transparent transition duration-300 ease-out font-sans  select-none items-center relative group/button  justify-center text-center items-center rounded-full cursor-pointer active:scale-[0.97] active:duration-150 active:ease-outExpo origin-center whitespace-nowrap inline-flex text-sm h-8 aspect-square"><div class="flex items-center min-w-0 font-medium gap-1.5 justify-center"><div class="flex shrink-0 items-center justify-center size-4"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7999999999999998" stroke-linecap="round" stroke-linejoin="round" class="tabler-icon tabler-icon-copy "><path d="M7 7m0 2.667a2.667 2.667 0 0 1 2.667 -2.667h8.666a2.667 2.667 0 0 1 2.667 2.667v8.666a2.667 2.667 0 0 1 -2.667 2.667h-8.666a2.667 2.667 0 0 1 -2.667 -2.667z"></path><path d="M4.012 16.737a2.005 2.005 0 0 1 -1.012 -1.737v-10c0 -1.1 .9 -2 2 -2h10c.75 0 1.158 .385 1.5 1"></path></svg></div></div></button></div><div class="-mt-xl"><div><div class="text-text-200 bg-background-300 py-xs px-sm inline-block rounded-br rounded-tl-[3px] font-thin">typescript</div></div><div class="pr-lg"><span><code><span><span class="token token">// Example: Send claim to Perplexity API</span><span>
</span></span><span><span></span><span class="token token">const</span><span></span><span class="token token function-variable">verifyClaim</span><span></span><span class="token token operator">=</span><span></span><span class="token token">async</span><span></span><span class="token token punctuation">(</span><span>claim</span><span class="token token operator">:</span><span></span><span class="token token">string</span><span class="token token punctuation">)</span><span></span><span class="token token operator">=></span><span></span><span class="token token punctuation">{</span><span>
</span></span><span><span></span><span class="token token">const</span><span> response </span><span class="token token operator">=</span><span></span><span class="token token">await</span><span></span><span class="token token">fetch</span><span class="token token punctuation">(</span><span class="token token">'https://api.perplexity.ai/chat/completions'</span><span class="token token punctuation">,</span><span></span><span class="token token punctuation">{</span><span>
</span></span><span><span>    method</span><span class="token token operator">:</span><span></span><span class="token token">'POST'</span><span class="token token punctuation">,</span><span>
</span></span><span><span>    headers</span><span class="token token operator">:</span><span></span><span class="token token punctuation">{</span><span>
</span></span><span><span></span><span class="token token string-property property">'Authorization'</span><span class="token token operator">:</span><span></span><span class="token token template-string template-punctuation">`</span><span class="token token template-string">Bearer </span><span class="token token template-string interpolation interpolation-punctuation punctuation">${</span><span class="token token template-string interpolation">process</span><span class="token token template-string interpolation punctuation">.</span><span class="token token template-string interpolation">env</span><span class="token token template-string interpolation punctuation">.</span><span class="token token template-string interpolation constant">PPLX_KEY</span><span class="token token template-string interpolation interpolation-punctuation punctuation">}</span><span class="token token template-string template-punctuation">`</span><span class="token token punctuation">,</span><span>
</span></span><span><span></span><span class="token token string-property property">'Content-Type'</span><span class="token token operator">:</span><span></span><span class="token token">'application/json'</span><span>
</span></span><span><span></span><span class="token token punctuation">}</span><span class="token token punctuation">,</span><span>
</span></span><span><span>    body</span><span class="token token operator">:</span><span></span><span class="token token constant">JSON</span><span class="token token punctuation">.</span><span class="token token">stringify</span><span class="token token punctuation">(</span><span class="token token punctuation">{</span><span>
</span></span><span><span>      model</span><span class="token token operator">:</span><span></span><span class="token token">'sonar-deep-research'</span><span class="token token punctuation">,</span><span>
</span></span><span><span>      messages</span><span class="token token operator">:</span><span></span><span class="token token punctuation">[</span><span class="token token punctuation">{</span><span> role</span><span class="token token operator">:</span><span></span><span class="token token">'user'</span><span class="token token punctuation">,</span><span> content</span><span class="token token operator">:</span><span></span><span class="token token template-string template-punctuation">`</span><span class="token token template-string">Verify this claim: "</span><span class="token token template-string interpolation interpolation-punctuation punctuation">${</span><span class="token token template-string interpolation">claim</span><span class="token token template-string interpolation interpolation-punctuation punctuation">}</span><span class="token token template-string">"</span><span class="token token template-string template-punctuation">`</span><span></span><span class="token token punctuation">}</span><span class="token token punctuation">]</span><span class="token token punctuation">,</span><span>
</span></span><span><span>      search_domain_filter</span><span class="token token operator">:</span><span></span><span class="token token punctuation">[</span><span class="token token">'gov'</span><span class="token token punctuation">,</span><span></span><span class="token token">'edu'</span><span class="token token punctuation">]</span><span class="token token punctuation">,</span><span>
</span></span><span><span>      return_related_questions</span><span class="token token operator">:</span><span></span><span class="token token boolean">true</span><span class="token token punctuation">,</span><span>
</span></span><span><span>      max_tokens</span><span class="token token operator">:</span><span></span><span class="token token">1000</span><span>
</span></span><span><span></span><span class="token token punctuation">}</span><span class="token token punctuation">)</span><span>
</span></span><span><span></span><span class="token token punctuation">}</span><span class="token token punctuation">)</span><span class="token token punctuation">;</span><span>
</span></span><span><span></span><span class="token token">return</span><span> response</span><span class="token token punctuation">.</span><span class="token token">json</span><span class="token token punctuation">(</span><span class="token token punctuation">)</span><span class="token token punctuation">;</span><span>
</span></span><span><span></span><span class="token token punctuation">}</span><span class="token token punctuation">;</span><span>
</span></span><span></span></code></span></div></div></div></pre>

---

## Contributing

- Use Husky for pre-commit checks (lint, type-check).
- All code must be TypeScript and pass CI (GitHub Actions).
- Use Docker for local development of backend services.

---

## License

MIT

---

## Contact

For questions or contributions, open an issue or contact the maintainer.

---

Answer from Perplexity: [pplx.ai/share](https://www.perplexity.ai/search/pplx.ai/share)
