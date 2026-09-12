<script>
 let value = await Promise.resolve('ready');
</script>
{#snippet display(value)}
 <p>{value}</p>
{/snippet}
{@render display(value)}
