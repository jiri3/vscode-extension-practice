<template>
  <div>
    <div class="example">
      {{ msg }}
    </div>
    <router-link to="/">戻る</router-link>
  </div>
</template>

<script lang="ts">
export default {
  data() {
    return {
      msg: "Example2",
    };
  },
};
</script>

<style scoped>
.example {
  color: blue;
}
</style>