<script>
 let others = { onclick: () => {} };
</script>
<select><option>o1</option><option selected>o2</option></select>
<select {...others}><option>o1</option><option selected>o2</option></select>
