{#each { length: 1 } as _, index}
 <button type="button" onclick={() => console.log(index)}>A</button>
 <button type="button" data-index={index} onclick={(e) => {
  const index = Number(e.currentTarget.dataset.index);
  console.log(index);
 }}>B</button>
 <button type="button" data-index={index} onclick={(e) => {
  const i = Number(e.currentTarget.dataset.index);
  console.log(i);
 }}>C</button>
{/each}
