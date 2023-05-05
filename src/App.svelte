<!-- Delete this stuff! -->
<script>
  let count = 0;
</script>

<h1>Hello world</h1>
<span>
  This is a template which supports less, GitHub pages deploy and more!
</span>
<button on:click={() => count++}>You've clicked {count} times</button>

<style lang="less">
  @import "main.less";
  :global(body) {
    .flex();
    h1 {
      font-weight: 100;
      font-style: italic;
      color: fade(@text, 90%);
    }
    span {
      .font.light();
      font-size: 1.2rem;
    }
    button {
      margin-top: 1rem;
      .button();
    }
  }
</style>
