// src/components/Creasing/CreasingOptions.ts

export type CreasingOption = {
  label: string;
  value: string;
  image: any;
};

export const CREASING_OPTIONS: CreasingOption[] = [
  {
    label: 'Type 1',
    value: 'opt1',
    image: require('../../assets/crease_1.png'),
  },
  {
    label: 'Type 2',
    value: 'opt2',
    image: require('../../assets/crease_2.png'),
  },
  {
    label: 'Type 3',
    value: 'opt3',
    image: require('../../assets/crease_3.png'),
  },
  {
    label: 'Type 4',
    value: 'opt4',
    image: require('../../assets/crease_4.png'),
  },
];
