// components/radio/radio.ts
Component({
  relations: {
    './radio-group': {
      type: 'parent'
    }
  },
  externalClasses: ['radio-class', 'radio-checked-class'],
  properties: {
    checked: { type: Boolean, value: false },
    value: { type: String, optionalTypes: [Number, Object, Array], value: '' }
  },
  data: {
    isChecked: false
  },
  lifetimes: {
    attached() {
      this.setData({
        isChecked: this.data.checked
      });
    }
  },
  methods: {
    willSelect() {
      this.setData({ isChecked: true });
      const [group] = this.getRelationNodes('./radio-group');
      if (group) {
        group.receivedRadioChecked(this.data.value);
      }
    }
  }
})
