export default function getCustomizationModule() {
  return [
    {
      name: 'default',
      value: [
        {
          id: 'ohif.overlayItem',
          uiType: 'uiType',
          content: function (props) {
            const { instance, label } = props;
            const value = this.attribute
              ? instance[this.attribute]
              : this.contentF(props);
            if (!value) return null;
            return (
              <span>
                ${label} ${value}
              </span>
            );
          },
        },
      ],
    },
  ];
}
