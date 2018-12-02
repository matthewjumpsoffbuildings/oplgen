Compile Dock6
- gcc, g++, gfortran
- on OSX use homebrew and add /usr/local/bin to .bash_profile path, then `ln -s gcc-8 gcc` etc to use brew version of gcc/++/fortran

steps

- generate.js to generate tons of smiles
- filter.js to sort by properties like logP and charge and then pick the top 100 or so smiles
- mol2.js to convert those top 100 or so smiles to mol2
- dock.js to dock the top 100 mol2s


Convert SMILES to mol2 with OpenBabel
https://openbabel.org/docs/dev/Command-line_tools/babel.html#conformers
`obabel -i smi input.smiles -o mol2 -O output.mol2 --gen3d --conformer --nconf 5 --weighted`

obgen file.smiles
