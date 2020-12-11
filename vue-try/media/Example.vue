<template>
  <div>
    <div class="hoge">
      {{ msg }}
    </div>
  </div>
</template>

<script lang="ts">
export default {
  data() {
    return {
      msg: "Hello world Vue",
    };
  },
};
</script>

<style scoped>
.hoge {
  color: red;
}
</style>