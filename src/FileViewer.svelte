<svelte:options tag="file-viewer" />

<script>
    import { onMount } from "svelte";
    import { FileViewer } from "./utils/file-viewer";

    export let url = null;
    export let filename = null;

    let formattedUrl
    let fileTypeSupported;

    onMount(() => {
        setTimeout(() => { // svelte's bug
            formattedUrl = FileViewer(url, filename);

            fileTypeSupported = formattedUrl !== "not supported";
        }, 0);
    });

    function isNil(obj) {
        return obj === undefined || obj === null;
    }

    function dispatchOnLoad(e) {
        const event = new CustomEvent("onload", {
            detail: `file viewer on load`,
            bubbles: true,
            cancelable: true,
            composed: true
        });

        this.dispatchEvent(event);
    }
</script>


{#if !isNil(formattedUrl) && !isNil(fileTypeSupported) && fileTypeSupported}
    <div class="file-view-iframe-conatiner">
        <iframe title={filename} src={formattedUrl} on:load={dispatchOnLoad} frameborder="0"></iframe>
    </div>
{:else}
     <slot name="not-supported">
        File extension is not supported.
     </slot>
{/if}

<style>
    .file-view-iframe-conatiner, iframe {
        height: 100%;
        width: 100%;
    }
</style>
