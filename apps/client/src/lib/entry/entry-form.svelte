<script lang='ts'>
  import type { AvatarSpriteType } from '@kangeikai/shared'
  import type { GuestProfile } from './guest-profile-schema'
  import * as v from 'valibot'
  import { MAX_NAME_LENGTH } from './constants'
  import { generateDefaultName } from './default-name'
  import { avatarTypeSchema, displayNameSchema } from './guest-profile-schema'
  import { GuestProfileStore } from './guest-profile-store'

  interface Props {
    /**
     * Called with the validated profile and the (possibly empty) access code once the person
     * confirms (FR-009) — the server decides whether the code is actually required.
     */
    onConfirm: (profile: GuestProfile, accessCode: string) => void
    /**
     * Set by the parent when a previous attempt's room join was rejected (e.g. wrong access
     * code) — cleared as soon as the person edits the code again.
     */
    joinError?: string
    /**
     * True while a submitted room join is in flight — disables the form and shows a spinner
     * on the submit button, rather than replacing this form with a separate loading screen.
     */
    pending?: boolean
  }

  const { onConfirm, joinError, pending = false }: Props = $props()

  // Read once at component creation — pre-fills a returning visitor's previous choice (FR-005,
  // US2), or a friendly generated name for a first-time visitor (FR-006, US3) when nothing is
  // stored.
  const storedProfile = new GuestProfileStore().load()

  let name = $state(storedProfile?.displayName ?? generateDefaultName())
  let avatarType = $state<AvatarSpriteType>(storedProfile?.avatarType ?? 'man')
  // Never persisted — it's a shared room lock, not part of the guest's identity/appearance.
  let accessCode = $state('')
  let error = $state<string | undefined>()

  function handleSubmit(event: SubmitEvent): void {
    event.preventDefault()

    const nameResult = v.safeParse(displayNameSchema, name)
    if (!nameResult.success) {
      error = 'Please enter a name.'
      return
    }

    const avatarResult = v.safeParse(avatarTypeSchema, avatarType)
    if (!avatarResult.success) {
      return
    }

    error = undefined
    onConfirm({ displayName: nameResult.output, avatarType: avatarResult.output }, accessCode)
  }
</script>

<div class='entry-overlay'>
  <form class='entry-form' onsubmit={handleSubmit}>
    <h1>Join the space</h1>

    <label for='entry-name'>Name</label>
    <input
      id='entry-name'
      type='text'
      autocomplete='off'
      maxlength={MAX_NAME_LENGTH}
      bind:value={name}
      disabled={pending}
      oninput={() => (error = undefined)}
    />

    <fieldset disabled={pending}>
      <legend>Avatar</legend>
      <label>
        <input type='radio' name='avatarType' value='man' bind:group={avatarType} />
        Man
      </label>
      <label>
        <input type='radio' name='avatarType' value='woman' bind:group={avatarType} />
        Woman
      </label>
    </fieldset>

    <label for='entry-access-code'>Access code (if you have one)</label>
    <input
      id='entry-access-code'
      type='password'
      autocomplete='off'
      bind:value={accessCode}
      disabled={pending}
      oninput={() => (error = undefined)}
    />

    {#if error}
      <p class='error'>{error}</p>
    {:else if joinError}
      <p class='error'>{joinError}</p>
    {/if}

    <button type='submit' disabled={pending}>
      {#if pending}
        <span class='spinner'></span> Connecting…
      {:else}
        Enter
      {/if}
    </button>
  </form>
</div>

<style>
  .entry-overlay {
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #1a1a1a;
  }

  .entry-form {
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: 280px;
    padding: 24px;
    border-radius: 12px;
    background: #262626;
    color: #fff;
  }

  h1 {
    margin: 0 0 8px;
    font-size: 18px;
  }

  label {
    font-size: 14px;
  }

  input[type='text'],
  input[type='password'] {
    padding: 8px;
    border: 1px solid #4a4a4a;
    border-radius: 6px;
    background: #1a1a1a;
    color: #fff;
    font-size: 14px;
  }

  fieldset {
    display: flex;
    gap: 16px;
    padding: 8px 0 0;
    border: none;
  }

  fieldset label {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  legend {
    margin-bottom: 4px;
    padding: 0;
    font-size: 14px;
  }

  .error {
    margin: 0;
    color: #f87171;
    font-size: 13px;
  }

  button[type='submit'] {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 10px;
    border: none;
    border-radius: 6px;
    background: #e8a9c9;
    color: #3a2030;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
  }

  button[type='submit']:disabled {
    cursor: not-allowed;
    opacity: 0.7;
  }

  .spinner {
    width: 14px;
    height: 14px;
    border: 2px solid rgb(58 32 48 / 30%);
    border-top-color: #3a2030;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
