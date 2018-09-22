Compile Dock6
- gcc, g++, gfortran
- on OSX use homebrew and add /usr/local/bin to .bash_profile path, then `ln -s gcc-8 gcc` etc to use brew version of gcc/++/fortran


Convert SMILES to mol2 with OpenBabel
https://openbabel.org/docs/dev/Command-line_tools/babel.html#conformers
`obabel -i smi input.smiles -o mol2 -O output.mol2 --gen3d --conformer --nconf 5 --weighted`
