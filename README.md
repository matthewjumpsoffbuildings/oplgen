garbage collection, especially in random/cyclic generate js (linear seems to be good)

how to handle running generate/filter over an existing folder of outputs. global binary could help


Compile Dock6
- gcc, g++, gfortran
- on OSX use homebrew and add /usr/local/bin to .bash_profile path, then `ln -s gcc-8 gcc` etc to use brew version of gcc/++/fortran

steps

- generate.js to generate tons of smiles
- filter.js to sort by properties like logP and charge and then pick the top 100 or so smiles
- mol2.js to convert those top 100 or so smiles to mol2
- dock.js to dock the top 100 mol2s
