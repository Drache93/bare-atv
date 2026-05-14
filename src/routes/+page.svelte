<script lang="ts">
  import { enhance } from '$app/forms';
  import { onMount } from 'svelte';

  type Status = 'connecting' | 'pin' | 'ready' | 'error';

  let playing = $state(false);
  let status = $state<Status>('connecting');
  let deviceName = $state<string | null>(null);
  let errorMsg = $state<string | null>(null);
  let dimmed = $derived(status !== 'ready');

  onMount(() => {
    const es = new EventSource('/api/events');
    es.addEventListener('pinNeeded', () => { status = 'pin'; });
    es.addEventListener('status', (e) => {
      const data = JSON.parse((e as MessageEvent).data);
      deviceName = data.name ?? null;
      status = 'ready';
    });
    es.addEventListener('atvError', (e) => {
      const data = JSON.parse((e as MessageEvent).data);
      errorMsg = data.message;
      status = 'error';
    });
    return () => es.close();
  });
</script>

<div class="min-h-dvh bg-black flex flex-col items-center justify-center gap-5 select-none">

  <span class="text-[11px] font-medium tracking-[0.14em] uppercase text-white/25 mb-4">
    {deviceName ?? 'Apple TV'}
  </span>

  {#if status === 'pin'}
    <div class="flex flex-col items-center gap-4">
      <p class="text-white/50 text-sm text-center leading-relaxed">
        Enter the PIN shown<br>on your Apple TV
      </p>
      <form
        method="POST"
        action="?/submitPin"
        class="flex flex-col items-center gap-3"
        use:enhance={() => async ({ update }) => { await update({ reset: true }); }}
      >
        <input
          name="pin"
          type="text"
          inputmode="numeric"
          maxlength="6"
          autocomplete="off"
          placeholder="000000"
          class="w-40 h-14 rounded-2xl bg-white/[0.07] border border-white/[0.15] text-white text-2xl font-mono text-center tracking-[0.3em] placeholder:text-white/20 outline-none focus:border-white/30 focus:bg-white/10 transition-all"
        />
        <button
          type="submit"
          class="h-12 w-40 rounded-full bg-white text-black text-[15px] font-semibold cursor-pointer transition-all active:scale-95 active:opacity-80"
        >
          Pair
        </button>
      </form>
    </div>

  {:else}
    <!-- D-pad -->
    <div class="grid grid-cols-3 gap-2">
      <div></div>
      <form method="POST" action="?/up" use:enhance={() => async ({ update }) => { await update({ reset: false }); }}>
        <button type="submit" disabled={dimmed} aria-label="Up"
          class="w-[72px] h-[72px] rounded-2xl bg-white/[0.07] border border-white/[0.12] text-white/85 flex items-center justify-center cursor-pointer transition-all duration-100 active:scale-95 active:bg-white/15 hover:bg-white/10 hover:border-white/20 [-webkit-tap-highlight-color:transparent] disabled:opacity-25 disabled:pointer-events-none">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5"><path d="M18 15l-6-6-6 6"/></svg>
        </button>
      </form>
      <div></div>

      <form method="POST" action="?/left" use:enhance={() => async ({ update }) => { await update({ reset: false }); }}>
        <button type="submit" disabled={dimmed} aria-label="Left"
          class="w-[72px] h-[72px] rounded-2xl bg-white/[0.07] border border-white/[0.12] text-white/85 flex items-center justify-center cursor-pointer transition-all duration-100 active:scale-95 active:bg-white/15 hover:bg-white/10 hover:border-white/20 [-webkit-tap-highlight-color:transparent] disabled:opacity-25 disabled:pointer-events-none">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
      </form>
      <form method="POST" action="?/click" use:enhance={() => async ({ update }) => { await update({ reset: false }); }}>
        <button type="submit" disabled={dimmed} aria-label="Select"
          class="w-[72px] h-[72px] rounded-full bg-white/[0.07] border border-white/[0.12] text-white/85 flex items-center justify-center cursor-pointer transition-all duration-100 active:scale-95 active:bg-white/15 hover:bg-white/10 hover:border-white/20 [-webkit-tap-highlight-color:transparent] disabled:opacity-25 disabled:pointer-events-none">
          <div class="w-2.5 h-2.5 rounded-full bg-white/60"></div>
        </button>
      </form>
      <form method="POST" action="?/right" use:enhance={() => async ({ update }) => { await update({ reset: false }); }}>
        <button type="submit" disabled={dimmed} aria-label="Right"
          class="w-[72px] h-[72px] rounded-2xl bg-white/[0.07] border border-white/[0.12] text-white/85 flex items-center justify-center cursor-pointer transition-all duration-100 active:scale-95 active:bg-white/15 hover:bg-white/10 hover:border-white/20 [-webkit-tap-highlight-color:transparent] disabled:opacity-25 disabled:pointer-events-none">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5"><path d="M9 18l6-6-6-6"/></svg>
        </button>
      </form>

      <div></div>
      <form method="POST" action="?/down" use:enhance={() => async ({ update }) => { await update({ reset: false }); }}>
        <button type="submit" disabled={dimmed} aria-label="Down"
          class="w-[72px] h-[72px] rounded-2xl bg-white/[0.07] border border-white/[0.12] text-white/85 flex items-center justify-center cursor-pointer transition-all duration-100 active:scale-95 active:bg-white/15 hover:bg-white/10 hover:border-white/20 [-webkit-tap-highlight-color:transparent] disabled:opacity-25 disabled:pointer-events-none">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5"><path d="M6 9l6 6 6-6"/></svg>
        </button>
      </form>
      <div></div>
    </div>

    <!-- Play/Pause + Back -->
    <div class="flex gap-3 mt-1">
      <form
        method="POST"
        action="?/playPause"
        use:enhance={() => {
          playing = !playing;
          return async ({ update }) => { await update({ reset: false }); };
        }}
      >
        <button
          type="submit"
          disabled={dimmed}
          aria-label={playing ? 'Pause' : 'Play'}
          class="w-[112px] h-[56px] rounded-full bg-white/[0.07] border border-white/[0.12] text-white/85 flex items-center justify-center cursor-pointer transition-all duration-100 active:scale-95 active:bg-white/15 hover:bg-white/10 hover:border-white/20 [-webkit-tap-highlight-color:transparent] disabled:opacity-25 disabled:pointer-events-none"
        >
          {#if playing}
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6">
              <rect x="5" y="3" width="4" height="18" rx="1"/>
              <rect x="15" y="3" width="4" height="18" rx="1"/>
            </svg>
          {:else}
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6 translate-x-0.5">
              <polygon points="6 3 20 12 6 21"/>
            </svg>
          {/if}
        </button>
      </form>

      <form method="POST" action="?/back" use:enhance={() => async ({ update }) => { await update({ reset: false }); }}>
        <button
          type="submit"
          disabled={dimmed}
          class="h-[56px] w-[112px] rounded-full bg-white/[0.07] border border-white/[0.12] text-white/85 flex items-center justify-center gap-2 text-[15px] font-medium cursor-pointer transition-all duration-100 active:scale-95 active:bg-white/15 hover:bg-white/10 hover:border-white/20 [-webkit-tap-highlight-color:transparent] disabled:opacity-25 disabled:pointer-events-none"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-[17px] h-[17px]">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
          Back
        </button>
      </form>
    </div>

    <!-- Volume -->
    <div class="flex gap-3">
      <form method="POST" action="?/volumeDown" use:enhance={() => async ({ update }) => { await update({ reset: false }); }}>
        <button type="submit" disabled={dimmed} aria-label="Volume down"
          class="w-[112px] h-[52px] rounded-full bg-white/[0.07] border border-white/[0.12] text-white/85 flex items-center justify-center cursor-pointer transition-all duration-100 active:scale-95 active:bg-white/15 hover:bg-white/10 hover:border-white/20 [-webkit-tap-highlight-color:transparent] disabled:opacity-25 disabled:pointer-events-none">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
            <line x1="15" y1="12" x2="21" y2="12"/>
          </svg>
        </button>
      </form>
      <form method="POST" action="?/volumeUp" use:enhance={() => async ({ update }) => { await update({ reset: false }); }}>
        <button type="submit" disabled={dimmed} aria-label="Volume up"
          class="w-[112px] h-[52px] rounded-full bg-white/[0.07] border border-white/[0.12] text-white/85 flex items-center justify-center cursor-pointer transition-all duration-100 active:scale-95 active:bg-white/15 hover:bg-white/10 hover:border-white/20 [-webkit-tap-highlight-color:transparent] disabled:opacity-25 disabled:pointer-events-none">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
          </svg>
        </button>
      </form>
    </div>

    {#if status === 'error'}
      <p class="text-red-400/50 text-xs mt-2">{errorMsg}</p>
    {:else if status === 'connecting'}
      <p class="text-white/20 text-xs mt-2">Connecting…</p>
    {/if}
  {/if}

</div>
