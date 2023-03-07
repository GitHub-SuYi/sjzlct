// components/radio/radio-group.ts
// <f-radio-group radio-group-class="radio-group" bind:changed="onCountModelChanged">
//   <f-radio radio-checked-class="_br" value="{{111}}">111</f-radio>
//   <f-radio radio-checked-class="_br" checked value="222">222</f-radio>
// </f-radio-group>

Component({
  externalClasses: ['radio-group-class'],
  relations: {
    './radio': {
      type: 'child',
      linked(target) {
        if (target.data.checked) {
          this.setData({ value: target.data.value });
        }
      }
    }
  },
  data: {
    value: null
  },
  methods: {
    receivedRadioChecked(radioValue: any) {
      this.setData({ value: radioValue });
      this.triggerEvent('changed', radioValue);
      const radios = this.getRelationNodes('./radio');
      radios.forEach(r => {
        r.setData({ isChecked: radioValue === r.data.value });
      });
    }
  }
})
