<script>
 let value = await Promise.resolve('ready');
</script>
{#snippet display()}
 <p>{value}</p>
{/snippet}
{@render display()}
