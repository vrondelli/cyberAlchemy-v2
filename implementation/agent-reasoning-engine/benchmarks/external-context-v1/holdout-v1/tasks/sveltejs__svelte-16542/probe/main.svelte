<svelte:boundary>
	{#snippet pending()}
	{/snippet}
	{@const number = await Promise.resolve(5)}
	{number}
</svelte:boundary>
