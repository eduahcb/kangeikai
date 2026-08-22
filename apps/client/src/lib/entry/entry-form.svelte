<script lang='ts'>
  import type { AvatarSpriteType } from '@kangeikai/shared'
  import type { GuestProfile } from './guest-profile-schema'
  import * as v from 'valibot'
  import { MAX_NAME_LENGTH } from './constants'
  import { avatarTypeSchema, displayNameSchema } from './guest-profile-schema'

  interface Props {
    /** Called with the validated profile once the person confirms (FR-009). */
    onConfirm: (profile: GuestProfile) => void
  }

  const { onConfirm }: Props = $props()

  let name = $state('')
  let avatarType = $state<AvatarSpriteType>('man')
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
    onConfirm({ displayName: nameResult.output, avatarType: avatarResult.output })
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
      oninput={() => (error = undefined)}
    />

    <fieldset>
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

    {#if error}
      <p class='error'>{error}</p>
    {/if}

    <button type='submit'>Enter</button>
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

  input[type='text'] {
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
    padding: 10px;
    border: none;
    border-radius: 6px;
    background: #e8a9c9;
    color: #3a2030;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
  }
</style>
