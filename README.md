Requirements

- node+npm
- openbabel
- dock6

Generate:
```
{ name: 'number', alias: 'n', type: Number, defaultValue: 1000000 }, 0 = maximum
{ name: 'sequenceLength', alias: 'l', type: Number, defaultValue: 5 },
{ name: 'outputDir', alias: 'o', type: String, defaultValue: "output" },
{ name: 'input', alias: 'i', type: String, defaultValue: "subunits.json" },
{ name: 'delimiter', alias: 'd', type: String, defaultValue: "__" },
{ name: 'linear', type: Boolean, defaultValue: false },
{ name: 'ringClosureDigit', alias: 'r', type: Number, defaultValue: 9 },
{ name: 'conserve', alias: 'c', type: String },
{ name: 'sequential', alias: 's', type: Boolean, defaultValue: false}
```

Filter:
```
{ name: 'inputFolder', alias: 'i', type: String, defaultValue: "output" },
{ name: 'outputFolder', alias: 'o', type: String, defaultValue: "converted" },
{ name: 'subunits', alias: 's', type: String, defaultValue: "subunits.json" },
{ name: 'delimiter', alias: 'd', type: String, defaultValue: "__" },
{ name: 'number', alias: 'n', type: Number, defaultValue: 100 }
```


garbage collection, especially in random/cyclic generate js (linear seems to be good)

how to handle running generate/filter over an existing folder of outputs. global binary could help


Compile Dock6
- gcc, g++, gfortran
- on OSX use homebrew and add /usr/local/bin to .bash_profile path, then `ln -s gcc-8 gcc` etc to use brew version of gcc/++/fortran

steps

- generate.js to generate tons of smiles
- filter.js to sort by properties like logP and charge and then pick the top 100 or so smiles and convert those top 100 or so smiles to mol2
- dock.js to dock the top 100 mol2s
