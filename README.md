# Smiles Generator

Simple command line tools to generate linear and cyclic chains in SMILES format, filter them based on drug-likeness, and convert them to MOL2 format using openbabel

## Installation

Before installing, ensure you have the following requirements

- [node+npm](https://nodejs.org/en/download/)
- [openbabel](http://openbabel.org/wiki/Category:Installation)

Once you have the requirements, run the following in a command terminal:
```
npm install -g smiles-generator
```

If you are on linux or OSX you may need to add `sudo` at the start of the install command like so:
```
sudo npm install -g smiles-generator
```

## Usage

This program contains 3 command line utilities:

- `smiles-generate`
- `smiles-filter`
- `smiles-get-subunits`

### smiles-generate

Generate a specified number of SMILES files from a collection of subunits stored in JSON format. The following options are available:

- `-l --sequenceLength` - default: `5`
	- How long should each chain of subunits be?
- `-n --number` - default: `1000000`
	- How many SMILES to generate? Given even relatively short chain lengths, the number of possible unique chains is often beyond a home computers capability to generate, so this defaults to 1000000
	- If you pass a number greater than the possible number of unique chains for the given length/subunits, it will generate all possible unique chains
	- If you pass a number less than 1, it will generate all possible unique chains for the given length/subunits
- `-o --outputDir` - default: `smiles`
	- Where should the generated smiles go?
- `-i --input`
	- Where should the generator look for the subunits JSON data?
	- By default, the program has a subunits JSON file with 32 common subunits, if you dont specify this argument this is what is used
	- If you want to customise the default subunits JSON, you can use the `smiles-get-subunits` command. This will insert the default JSON into the current working directory, for you to add/remove/modify subunits as needed
- `-c --conserve`
	- By default all chains are generated using randomly selected subunits from the subunits JSON.
	- If you want to ensure 1 or more specific subunits is present in all chains generated, you can use this argument
	- This argument takes the form `-c POSITION:SUBUNIT,POSITION:SUBUNIT`
	- For example to conserve `ADDA` at position 1 of all generated chains: `-c 1:ADDA`
	- To conserve `ADDA` at position 2 and `D-ALA` at position 5: `-c 2:ADDA,5:D-ALA`
- `--linear`
	- By default the chains generated will be cyclic. Passing the `--linear` argument makes the generated chains linear
- `-d --delimiter` - default: `__`
	- Unlikely to require editing.
	- Generated SMILES will be named based on the subunits they are composed of. The delimiter is used to separate these names. For example, a SMILES file composed from `ADDA`, `D-ALA`, `ABA`, will be called `ADDA__D-ALA__ABA`.
- `-r --ringClosureDigit` - default: `9`
	- Unlikely to require editing.
	- The digit used to close cyclic chains in the generated SMILES files
- `-s --sequential`
	- Unlikely to require editing
	- By default, chains are generated randomly.
	- This argument instead generates chains in sequential order, changing one piece of the chain at a time. This is faster than random generation, but not useful if you want a sampling of a wide range of the possible chains
	- If the chain length and subunits specified is unable to generate the requested number of chains, or if you request all possible chains, sequential generation is automatically activated


Filter:
```
{ name: 'inputFolder', alias: 'i', type: String, defaultValue: "output" },
{ name: 'outputFolder', alias: 'o', type: String, defaultValue: "converted" },
{ name: 'subunits', alias: 's', type: String, defaultValue: "subunits.json" },
{ name: 'delimiter', alias: 'd', type: String, defaultValue: "__" },
{ name: 'number', alias: 'n', type: Number, defaultValue: 100 },
{ name: 'range', alias: 'r', type: Number, defaultValue: 0 } 0 = same range as number
```


garbage collection, especially in random/cyclic generate js (linear seems to be good)

how to handle running generate/filter over an existing folder of outputs. global binary could help


Compile Dock6
- gcc, g++, gfortran
- on OSX use homebrew and add /usr/local/bin to .bash_profile path, then `ln -s gcc-8 gcc` etc to use brew version of gcc/++/fortran

steps

- `smiles-generate` to generate tons of smiles
- `smiles-filter` to sort by properties like logP and charge and then pick the top 100 or so smiles and convert those top 100 or so smiles to mol2
