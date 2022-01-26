<template>
  <q-dialog ref="dialog" @hide="onDialogHide" :persistent="true">
    <q-card class="q-dialog-plugin" style="width: 850px; max-width: 80vw;">
      <q-card-section class="bg-primary text-white">
        <div class="text-h6">Selectionnez les variables</div>
      </q-card-section>

      <q-card-section class="q-pa-md q-mt-md">

        <div class="row justify-center q-pt-md">

            <q-select  dense outlined class="col-sm-5 col-xs-12 clearable q-pr-md q-pt-md"
                       v-for="(variable, index) in variables" v-bind:key="index"
               ref="mySelect"
               v-model="form.variables[index].column"
               :label="variable"
               :options="availableFilterColumns"
               :hide-bottom-space="true"
               option-label="name" option-value="code"
               :options-dense="true"
               use-input input-debounce="0"
               error-message="Champ requis."
               @filter="filterAvailableColumns">
              <template v-slot:no-option>
                <q-item>
                  <q-item-section class="text-grey">
                    Pas de colonnes
                  </q-item-section>
                </q-item>
              </template>
            </q-select>

        </div>

      </q-card-section>

      <!-- buttons example -->
      <q-card-actions align="right" class="bg-white text-primary">
        <q-btn color="primary" flat label="Annuler" @click="onCancelClick"/>
        <q-btn color="primary" label="Valider" @click="onOKClick"/>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script>
import {mapActions, mapState} from 'vuex'
import {required} from 'vuelidate/lib/validators'

export default {
  name: 'VariableFormulaForm',
  components: {},
  props: {
    // ...your custom props
    title: String,
    variables: Array,
    availableColumns: Array,
    item: Object,
    iconType: {
      type: String,
      default: 'fa fa-',
    },
  },

  data() {
    return {
      form: {
        variables: [],
      },
      availableFilterColumns: [],

    }
  },

  validations: {
    form: {
      variables: {
        $each: {
          column: {required},
        }
      },

    },
  },

  methods: {
    // following method is REQUIRED
    // (don't change its name --> "show")
    show() {
      this.$refs.dialog.show()
    },

    // following method is REQUIRED
    // (don't change its name --> "hide")
    hide() {
      this.$refs.dialog.hide()
    },

    onDialogHide() {
      // required to be emitted
      // when QDialog emits "hide" event
      this.$emit('hide')
    },

    async onOKClick() {
      // on OK, it is REQUIRED to
      // emit "ok" event (with optional payload)
      // before hiding the QDialog
      try {
        let res = await this.submit()
        this.$emit('ok', res)
        this.hide()
      } catch (e) {
      }
    },

    onCancelClick() {
      // we just need to hide dialog
      this.hide()
    },

    filterAvailableColumns (val, update, abort) {
      update(() => {
        const needle = val.toLowerCase()
        this.availableFilterColumns = this.availableColumns.filter(v => v.name && v.name.toLowerCase().indexOf(needle) > -1)
      })
    },

    async prefetchList() {
    },

    submit() {
      this.$v.form.$touch()
      console.log(this.$v.form.$error)
      if (this.$v.form.$error) {
        return false
      }

      let data = this.form.variables.map(x =>{
        return {
          column: {name: x.column.name, code: x.column.code, type: x.column.type},
          variable: x.variable,
        }
      })
      return Promise.resolve(data)
    },

    ...mapActions({
    }),

    setForm() {
      this.form.variables = this.variables.map(x => {
        return {
          column: null,
          variable: x
        }
      })

      if(this.item.variables){
        this.form.variables.forEach((x, i) =>{
          let el = this.item.variables.find(y => y.variable === x.variable)
          if(el)
            this.form.variables[i].column = el.column
        })
      }

    },
  },

  computed: {
    ...mapState({
    }),
  },


  beforeMount() {
    this.setForm()
  },

  mounted() {

  },

}
</script>
