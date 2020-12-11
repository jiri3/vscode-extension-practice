<template>
  <div>
    <div class="example">
      {{ msg }}
    </div>
    <div>
      {{ exclamation }}
    </div>
    <router-link to="/">戻る</router-link>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";

@Component
export default class Example extends Vue {
  msg = "Hello world Vue";
  get exclamation() {
    return `${this.msg}!!!!`;
  }
}
</script>

<style scoped>
.example {
  color: red;
}
</style>