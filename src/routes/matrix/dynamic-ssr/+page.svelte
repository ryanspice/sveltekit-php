<script>
	export let data;
</script>

<h1>Dynamic SSR</h1>
<p>Message: {data.message}</p>
<p>Time: {data.time}</p>
<pre id="ssr-output">{JSON.stringify(data, null, 2)}</pre>
