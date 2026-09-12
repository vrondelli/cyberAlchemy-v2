<script>
 let value = 'steady';
 const selected = display;
</script>
{#snippet display()}
 <p>{value}</p>
{/snippet}
{@render selected()}
