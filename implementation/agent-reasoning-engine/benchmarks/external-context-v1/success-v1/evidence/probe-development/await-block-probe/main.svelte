<svelte:boundary>
 {#await Promise.resolve('ready') then value}
  {#snippet display()}
   <p>{value}</p>
  {/snippet}
  {@render display()}
 {/await}
 {#snippet pending()}<p>pending</p>{/snippet}
</svelte:boundary>
