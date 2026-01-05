<script>
    import { enhance } from '$app/forms';
    export let form;
</script>

<div class="container">
    <h1>Form Actions</h1>

    <form method="POST" action="?/default" use:enhance>
        <label>
            Enter Value:
            <input name="val" placeholder="Type something..." />
        </label>
        <button>Submit</button>
    </form>

    {#if form}
        <div class="result {form.success ? 'success' : 'error'}">
            <h3>Result:</h3>
            <pre>{JSON.stringify(form, null, 2)}</pre>
            {#if form.echo}
                <p>Echo: {form.echo}</p>
            {/if}
        </div>
    {/if}

    <br>
    <a href="/">Back to Home</a>
</div>

<style>
    .container { font-family: sans-serif; padding: 2rem; }
    .result { margin-top: 1rem; padding: 1rem; background: #eee; border-radius: 4px; }
    .success { border-left: 5px solid green; }
    .error { border-left: 5px solid red; }
</style>
