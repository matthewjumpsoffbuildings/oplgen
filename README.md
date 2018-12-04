# PepGen - Oligopeptide Generator

Simple command line tools to generate cyclic and linear oligopeptides in SMILES format, filter them based on drug-likeness, and perform ligand preparation for molecular docking using openbabel to convert to mol2

Developed by [@matthewjumpsoffbuildings](https://github.com/matthewjumpsoffbuildings), Co-Developed by Ezra

## Installation

Before installing, ensure you have the following requirements

- [node+npm](https://nodejs.org/en/download/)
- [openbabel](http://openbabel.org/wiki/Category:Installation) (for mol2 conversion)

Once you have the requirements, run the following in a cmd/terminal:
```
npm install -g pepgen
```

If you are on linux or OSX you may need to add `sudo` at the start of the install command like so:
```
sudo npm install -g pepgen
```

## Usage

This program contains 3 command line utilities:

- [`pep-generate`](#pep-generate)   (alias `pepgen`)
- [`pep-filter`](#pep-filter)       (alias `pepflt`)
- [`pep-subunits`](#pep-subunits)   (alias `pepsub`)

The ideal way to use these is to create separate folders for each type/length of chain you are interested in generating/filtering. For example if you want to generate cyclic chains of length 5, make a folder named `cyclo.5` or something similar, and open a cmd/terminal in that folder to run the generation/filtering. Then if you want to generate linear chains of length 4, make another folder named `linear.4` and open a cmd/terminal there to do the generation/filtering for that chain type.

### pep-generate
```
pep-generate -l 6 -n 25000

pepgen -l 4 -n 3000 --linear
```

Generate a specified number of oligopeptides in SMILES format from a collection of subunits stored in JSON format. For an example of how the subunits JSON is structured see the default JSON [here](./subunits.json)

The following options are available:

- `-l --sequenceLength` - default: `5`
	- How long should each generated chain of subunits be?
- `-n --number` - default: `1000000`
	- How many SMILES to generate? Given even relatively short chain lengths, the number of possible unique chains is often beyond a home computers capability to generate, so this defaults to `1000000`
	- If you pass a number greater than the possible number of unique chains for the given length/subunits, it will generate all possible unique chains
	- If you pass a number less than 1, it will generate all possible unique chains for the given length/subunits
- `-s --subunits` - default: [subunits.json](./subunits.json)
	- Where should the generator look for the subunits JSON data?
	- By default, the program has a subunits JSON file with 32 common subunits in its install directory
	- If no `subunits.json` file is present, or if you dont pass anything for this argument, the [default subunits JSON](./subunits.json) is used
	- If you pass a reference to a different JSON for this argument, it will attempt to find the file you specified, else it will fall back to using the default JSON
	- If you want to customise the default subunits JSON, you can use the `pep-subunits` command. This will insert the default JSON into the current working directory, for you to add/remove/modify subunits as needed
- `-c --conserve`
	- By default all chains are generated using randomly selected subunits from the subunits JSON.
	- If you want to ensure 1 or more specific subunits is present in all chains generated, you can use this argument
	- This argument takes the form `-c POSITION:SUBUNIT,POSITION:SUBUNIT`
	- For example to conserve `ADDA` at position 1 of all generated chains: `-c 1:ADDA`
	- To conserve `ADDA` at position 2 and `D-ALA` at position 5: `-c 2:ADDA,5:D-ALA`
- `--linear`
	- By default the chains generated will be cyclic. Passing the `--linear` argument makes the generated chains linear
- `-o --outputDir` - default: `smiles`
	- Unlikely to require editing.
	- Where should the generated smiles go?
- `-d --delimiter` - default: `__`
	- Unlikely to require editing.
	- Generated SMILES will be named based on the subunits they are composed of. The delimiter is used to separate these names. For example, a SMILES file composed from `ADDA`, `D-ALA`, `ABA`, will be called `ADDA__D-ALA__ABA`.
- `-r --ringClosureDigit` - default: `9`
	- Unlikely to require editing.
	- The digit used to close cyclic chains in the generated SMILES files
- `-q --sequential`
	- Unlikely to require editing
	- By default, chains are generated randomly.
	- This argument instead generates chains in sequential order, changing one piece of the chain at a time. This is faster than random generation, but not useful if you want a sampling of a wide range of the possible chains
	- If the chain length and subunits specified is unable to generate the requested number of chains, or if you request all possible chains, sequential generation is automatically activated


### pep-filter
```
pep-filter -n 100 -r 1000

pepflt -n 20 -r 400
```

Take a large number of SMILES files, sort them by drug-likeness, select a range from the top scorers, convert them to mol2 and create an `output.mol2` file ready for dock6. If an `output.mol2` file already exists, newly converted mol2s will be appended to it

- `-n --number` - default: `100`
	- How many of the generated SMILES do we want to convert to mol2 for dock6? Usually this will be a small sub-set of the total number of generated SMILES.
- `-r --range` - default: `same as --number`
	- After the program sorts all the SMILES on drug-likeness, what range of the sorted SMILES should the final 100 (or whatever amount we requested with the `-n`/`--number` argument) be selected from?
	- By default the range is set to the same as the requested number, meaning you get the top 100 of the sorted list
	- Since this means that there will be a lot less diversity, you may wish to make the range larger than the desired number, but smaller than the total amount of SMILES
	- For example, if you have generated 1,000,000 SMILES, and you want to sort them and turn 100 of them into mol2 files for docking, but you want a bit more diversity, you could set the range to 1000. This will select 100 randomly from the top 1000 SMILES files, as oposed to picking the exact top 100.
- `-i --inputFolder` - default: `smiles`
	- Unlikely to require editing
	- Where to look for the SMILES files generated by `pep-generate`
- `-o --outputFolder` - default: `mol2`
	- Unlikely to require editing
	- Where to put the individual mol2 files
- `-s --subunits` - default: [subunits.json](./subunits.json)
	- Where to find the `subunits.json` file. This should be the same JSON file used in the `pep-generate` step for the current working directory
	- As with `pep-generate`, by default if you dont pass this agument and `subunits.json` is not present in the working directory, the [default subunits JSON](./subunits.json) is used.
- `-d --delimiter` - default: `__`
	- This should be the same as the delimiter used in `pep-generate` (Which it is by default)
	- As with `pep-generate` this is unlikely to need editing.

### pep-subunits
```
pep-subunits

pepsub
```

Copy the [default subunits.json](./subunits.json) into the current working directory. You can then edit it as needed, and `pep-generate` will use your local copy when running in that directory, instead of the default subunits JSON file
