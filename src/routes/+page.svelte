<script lang="ts">
  import { enhance } from '$app/forms';
  import { onMount } from 'svelte';

  type Status = 'connecting' | 'pin' | 'ready' | 'error';

  let playing = $state(false);
  let status = $state<Status>('connecting');
  let deviceName = $state<string | null>(null);
  let errorMsg = $state<string | null>(null);
  let dimmed = $derived(status !== 'ready');
  let padActive = $state(false);
  let padEl = $state<HTMLElement | null>(null);

  let startX = 0;
  let startY = 0;
  let startRelX = 0;
  let startRelY = 0;

  function onPadDown(e: PointerEvent) {
    startX = e.clientX;
    startY = e.clientY;
    if (padEl) {
      const r = padEl.getBoundingClientRect();
      startRelX = e.clientX - (r.left + r.width / 2);
      startRelY = e.clientY - (r.top + r.height / 2);
    }
    padActive = true;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  async function onPadUp(e: PointerEvent) {
    if (!padActive) return;
    padActive = false;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (absDx < 20 && absDy < 20) {
      // Tap — use quadrant of initial touch position
      const absRelX = Math.abs(startRelX);
      const absRelY = Math.abs(startRelY);
      let action: string;
      if (absRelX < 40 && absRelY < 40) {
        action = 'click';
      } else if (absRelX > absRelY) {
        action = startRelX > 0 ? 'right' : 'left';
      } else {
        action = startRelY > 0 ? 'down' : 'up';
      }
      await fetch(`?/${action}`, { method: 'POST', body: new FormData() });
    } else {
      // Swipe — use movement direction
      const dir = absDx > absDy ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
      const fd = new FormData();
      fd.set('direction', dir);
      await fetch('?/swipe', { method: 'POST', body: fd });
    }
  }

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
    <!-- Touch pad -->
    <div
      role="button"
      tabindex="0"
      aria-label="Touchpad — swipe or tap to select"
      bind:this={padEl}
      class="w-[232px] h-[200px] rounded-3xl border border-white/[0.12] relative touch-none select-none [-webkit-tap-highlight-color:transparent] transition-all duration-100 {dimmed ? 'opacity-25 pointer-events-none' : ''} {padActive ? 'bg-white/[0.12]' : 'bg-white/[0.07]'}"
      onpointerdown={onPadDown}
      onpointerup={onPadUp}
      onpointercancel={() => { padActive = false; }}
    >
      <div class="absolute inset-0 flex items-center justify-center">
        <div class="w-9 h-9 rounded-full border border-white/[0.18]"></div>
      </div>
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
          aria-label="Play/Pause"
          class="w-[112px] h-[56px] rounded-full bg-white/[0.07] border border-white/[0.12] text-white/85 flex items-center justify-center gap-2 text-[15px] font-medium cursor-pointer transition-all duration-100 active:scale-95 active:bg-white/15 hover:bg-white/10 hover:border-white/20 [-webkit-tap-highlight-color:transparent] disabled:opacity-25 disabled:pointer-events-none"
        >
          {#if playing}
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-[17px] h-[17px]">
              <rect x="5" y="3" width="4" height="18" rx="1"/>
              <rect x="15" y="3" width="4" height="18" rx="1"/>
            </svg>
          {:else}
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-[17px] h-[17px] translate-x-px">
              <polygon points="6 3 20 12 6 21"/>
            </svg>
          {/if}
        </button>
      </form>

      <form method="POST" action="?/back" use:enhance={() => async ({ update }) => { await update({ reset: false }); }}>
        <button
          type="submit"
          disabled={dimmed}
          aria-label="Back"
          class="h-[56px] w-[112px] rounded-full bg-white/[0.07] border border-white/[0.12] text-white/85 flex items-center justify-center gap-2 text-[15px] font-medium cursor-pointer transition-all duration-100 active:scale-95 active:bg-white/15 hover:bg-white/10 hover:border-white/20 [-webkit-tap-highlight-color:transparent] disabled:opacity-25 disabled:pointer-events-none"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-[17px] h-[17px]">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
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
