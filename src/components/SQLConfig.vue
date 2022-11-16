<template>
  <q-dialog ref="dialog" @hide="onDialogHide" :persistent="true">
    <q-card class="q-dialog-plugin" style="width: 1300px; max-width: 80vw;">
      <q-card-section class="bg-primary text-white">
        <div class="text-h6">CONFIGURATION SQL</div>
      </q-card-section>

      <q-card-section class="q-pa-md q-mt-md" style="height: calc(100vh - 180px); overflow-y: hidden">

        <div class="col-12 q-ma-none q-px-lg text-center q-pt-sm" v-if="loading">
          <q-spinner-ios color="primary" size="2em"/>
          Vérification de votre requête...
          <q-tooltip :offset="[0, 8]">Veuillez patienter . . .</q-tooltip>
        </div>

        <div class="row">
          <div class="col-md-12">
            <q-btn
              :color='isVerified ? "primary" : "orange"'
              class="q-mb-xs float-right"
              :label='isVerified ? "Vérifier la syntaxe" : "! Vérifier la syntaxe !"'
              @click="onVerify"/>
          </div>

          <div class="col-md-12">

            <CodeEditor  v-model="code"
                         width="100%"
                         height="400px"
                         :languages="[['pgsql', 'PgSQL'], ['sql', 'SQL']]"
                         :wrap_code="true"
                         font_size="15px"
                         :autofocus="true"
                         :language_selector="true" >
            </CodeEditor>

          </div>
        </div>

        <div class="col-md-12 q-mt-md q-mb-md" >
          <q-input
            v-if="message_error"
            class="q-ml-md text-white bg-red"
            v-model="message_error"
            label-color="white"
            color="white"
            filled disable autogrow
            type="textarea"
          />

        </div>

<!--        <div class="row no-wrap q-pa-md">-->

          <div class="col-md-12"  style="height: 300px; overflow: auto">
            <q-list dense bordered padding v-if="columns.length >0">
              <q-item v-for="(item, index) in columns" v-bind:key="index">
                <q-item-section dense>
                  <q-card flat>
                    <template>

                      <div class="row">

                        <div class="col-3">
                          <q-input v-model="item.code" class="q-ml-md"  dense label="colonne" disable
                                   @m-blur="$v.columns.$each[index].code.$touch"
                                   :error="$v.columns.$each[index].code.$error"
                                   error-message="Champ requis."
                          />
                        </div>



                        <div class="col-4">
                          <q-input v-model="item.name" class="q-ml-md"  dense label="Nom"
                                   @m-blur="$v.columns.$each[index].name.$touch"
                                   :error="$v.columns.$each[index].name.$error"
                          />
                        </div>
                        <div class="col-5">

                          <q-select  dense outlined class="q-ml-md" clearable
                                     ref="mySelect"
                                     v-model="item.type"
                                     label="Type"
                                     :options="typeOptions"
                                     :hide-bottom-space="true"
                                     option-label="name" option-value="code"
                                     :options-dense="true" use-chips
                                     use-input input-debounce="0"
                                     @m-blur="$v.columns.$each[index].type.$touch"
                                     :error="$v.columns.$each[index].type.$error"
                                     error-message="Champ requis.">
                            <template v-slot:no-option>
                              <q-item>
                                <q-item-section class="text-grey">
                                  Pas de résultats
                                </q-item-section>
                              </q-item>
                            </template>
                          </q-select>
                        </div>

                      </div>
                    </template>
                  </q-card>
                </q-item-section>
              </q-item>

            </q-list>
          </div>
          <br>

<!--        </div>-->

        <div class="row no-wrap q-pa-md" v-if="false">
          <div class="col-md-12">
            <div>Paramètres</div>

            <q-list dense bordered padding v-if="params.length >0">
              <q-item v-for="(item, index) in params" v-bind:key="index">
                <q-item-section dense>
                  <q-card flat  >
                    <template>

                      <div class="row">

                        <div class="col-6">
                          <q-input v-model="item.param" class="q-ml-md"  dense label="Paramètre" disable />
                        </div>
                        <div class="col-6">
                          <q-input v-model="item.value" class="q-ml-md"  dense label="Valeur" />
                        </div>

                      </div>
                    </template>
                  </q-card>
                </q-item-section>
              </q-item>

            </q-list>
          </div>
        </div>


      </q-card-section>

      <!-- buttons example -->
      <q-card-actions align="right" class="bg-white text-primary relative-position">
        <q-btn color="primary" flat label="Annuler" @click="onCancelClick"/>
        <q-btn v-if="isVerified" color="primary" label="Valider" @click="onOKClick"/>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script>
import {mapActions, mapState} from 'vuex'
import {required} from 'vuelidate/lib/validators'
import get from "lodash/get";
import _clone from 'lodash/cloneDeep'
import CodeEditor from 'simple-code-editor';



export default {
  name: 'SQLConfigForm',
  components: {CodeEditor},
  props: {
    // ...your custom props
    sql_editor: Object,
    item: Object,
    parent: Object,
    iconType: {
      type: String,
      default: 'fa fa-',
    },
    appNotice: {
      type: String,
      default: '',
    },
    checkSqlApi: {
      type: String,
      default: '',
    },
    requestParams: {
      type: Object
    },
  },

  data() {
    return {
      message_error: '',
      code: '',
      isVerified: false,
      loading: false,
      cmOptions: {
       // tabSize: 4,
       // tabindex:4,
        lineWrapping: false,
        lineNumbers: false,
        styleActiveLine: true,
        viewportMargin: 100192,
        line: true,
        mode: 'text/x-pgsql',
        //mode: 'text/x-plsql',
        theme: 'hopscotch',
      },
      columns: [],
      columnsCache: {},
      params: [],
      typeOptions: [
        {id: 1, name: 'Texte', code: 'varchar'},
        {id: 2, name: 'Numerique', code: 'float4'},
        {id: 3, name: 'Date', code: 'timestamptz'},
      ]

    }
  },

  validations: {

    columns: {
      $each: {
        code: {required},
        name: {required},
        type: {required},
      }
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

    showNotification(notification) {
      this.$refs.dialog.$parent.$emit('showNotification', notification)
      this.$parent.$emit('showNotification', notification)
    },

    async onOKClick() {
      // on OK, it is REQUIRED to
      // emit "ok" event (with optional payload)
      // before hiding the QDialog

      if(!this.isVerified) {
        this.message_error = "Merci de cliquez sur le bouton Vérifier"
        return null
      }

      if(this.columns.length <= 0){
        this.message_error = "Merci de saisir une requête de sélection complète incluant des colonnes"
        return null
      }

      this.$v.$touch()
      if (this.$v.$invalid) {
        //this.showNotification({type: false,  message: 'Vérifiez si tous les champs sont correctement remplis!'})
        return null
      }

      try {
        let res = this.getPayload();
        this.$emit('ok', res)
        this.hide()
      } catch (e) {
      }
    },


    async onVerify(){
      let payload = {
        params: this.requestParams,
        request: this.code,
      }
      this.loading = true
      await this.$store.dispatch(this.checkSqlApi, payload).then(async (res) =>{

        this.setBackendVariables(get(res, "data.columns"))

        this.showNotification({type: true,  message:  "Votre requête est correcte" })
        this.isVerified = true
        this.message_error = null
        //console.log("resss", res)
      })
      .catch(err =>{
        this.showNotification({type: false,  message:  get(err, 'response.data.message', '') })
        this.message_error = get(err, 'response.data.data.error', '')
      })
      .finally(() => this.loading = false)


    },

    onCancelClick() {
      // we just need to hide dialog
      this.hide()
    },

    getPayload(){

      let module = {}
      let payload = {}
      module.app_code = this.appNotice
      module.table_description = "Requête personnalisée"
      module.table_name = "SQL EDITOR"
      module.columns = this.columns.map(x => {
        return {
          column_comment: `{"comment" : "${x.name}" }`,
          column_name: x.code,
          type: get(x, "type.code")
        }
      })
      payload.sql = this.code
      payload.module = module
      return payload;
    },

    setBackendVariables(columns){

      if(Array.isArray(columns)){

        const columnsTemp = []

        if(this.columns.length){
          this.columnsCache = this.columns.reduce((acc, row)=>{
            acc[row.code] = row;
            return acc
          },{})
        }

        columns.forEach(x =>{
          let code = get(x, "code");
          columnsTemp.push(
            this.columnsCache[code] ?  {...this.columnsCache[code]}:
              {
                name: get(x, "name"),
                code: get(x, "code"),
                type: this.typeOptions.find(x => x.id === 1),
              })
        })

        this.columns = columnsTemp
      }

    },

    ...mapActions({
    }),

    setForm() {

    },
  },

  computed: {
    ...mapState({
    }),
  },

  watch: {
    'code': {
      handler: function (sql, oldVal) {
        //console.log('code change ')

        if(sql){

          try {
            if(oldVal){
              //this.getInfosSQL()
            }
            this.isVerified = false
            //this.cmOptions.lineNumbers = true


          } catch (e){
          }

        }
      },
      deep: true,
    },
  },


  beforeMount() {
    this.setForm()
  },


  mounted() {

    //console.log("get(this.sql_editor, \"module.columns\")", get(this.sql_editor, "module.columns"))
    if(this.sql_editor && this.sql_editor.module){
      this.code = this.sql_editor.sql
      //this.cmOptions.lineNumbers = true

      this.columns = get(this.sql_editor, "module.columns").map(x =>{

        let comment = JSON.parse(get(x, 'column_comment'))
        return {
          code: x.column_name,
          name: comment.comment,
          type: this.typeOptions.find(y => y.code === x.type)
        }
      })
      if(this.columns.length >0)
        this.isVerified = true

      //console.log("this.columns", this.columns)
    }


  },

}
</script>

<style>
.CodeMirror-focused .cm-matchhighlight {
  background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFklEQVQI12NgYGBgkKzc8x9CMDAwAAAmhwSbidEoSQAAAABJRU5ErkJggg==);
  background-position: bottom;
  background-repeat: repeat-x;
}
.cm-matchhighlight {
  background-color: lightgreen;
}
.CodeMirror-selection-highlight-scrollbar {
  background-color: green;
}
</style>
