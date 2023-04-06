<template>
  <fusioncharts
    :type="type"
    :width="width"
    :height="height"
    :dataFormat="dataFormat"
    :dataSource="dataSource"
  ></fusioncharts>
</template>

<script>

  export default {
    name: "FuseChart",
    props: {
      width: {
        type: String,
        default: '100%',
      },
      height: {
        type: String,
        default: '100%',
      },
      type: {
        type: String,
        default: 'column2d',
      },
      dataFormat: {
        type: String,
        default: 'json',
      },
      dataSource: {
        type: Object,
        default: ()=> {},
      },
    },

    data() {
      return {}
    },

  }
</script>

<style scoped>

</style>
