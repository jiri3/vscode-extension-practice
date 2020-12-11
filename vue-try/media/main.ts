//@ts-ignore
import Top from "./Top";
//@ts-ignore
import Example from "./Example";
//@ts-ignore
import Example2 from "./Example2";

import Vue from "vue";
import VueRouter, { RouterOptions } from "vue-router";

const routerOption: RouterOptions = {
  routes: [
    { path: "/", component: Top },
    { path: "/example", component: Example },
    { path: "/example2", component: Example2 },
  ],
};
const router = new VueRouter(routerOption);
Vue.use(VueRouter);
router.push("/");
new Vue({
  el: `#entry`,
  template: `<router-view></router-view>`,
  router,
});
