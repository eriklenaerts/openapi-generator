# Open API Document Generator

Generate new Open API documents based on your own API REST guidelines. 

## Basic usage
``` bash
> npm install -g @eriklenaerts/openapi-docgen
> cd your-app
> openapi-docgen
```

## Examples
``` bash
// Show the commandline help
> openapi-docgen -h     

//Generate an API called 'Afspraken' the rest will be prompted
> openapi-docgen afspraken       

//Generate an API called 'Afspraken' with two resources 'location' and 'service'
> openapi-docgen afspraken -r location, service     

//Generate an API called 'Afspraken' with two resources 'location' and 'tenant', the latter will be classified under the `System` tag
> openapi-docgen afspraken -r location, tenant::system  

//Generate an API called 'Afspraken' with two resources 'location' and a sub resource 'address'
> openapi-docgen afspraken -r location, location/address    

//Generate an API called 'Afspraken' with a resource 'address' as a sub resource, a minimal parent 'location' resource will be added with a list and read operation
> openapi-docgen afspraken -r location/address    

//Generate an API called 'Afspraken' with two resources 'location' and 'service'. Only the list (GET collection) will be generated for the location. check out the operations modifier below
> openapi-docgen afspraken -r location[2], service     
```

## Calculate the Operations modifier 
You can determine per resource what operations need to be generated. Simply provide a number - that is the sum of the modifiers in the table below, to modify the generator's behaviour.
This modifier can be added in square brackets with each resource in the command line.

To calculcate this number, use the following table:
| Operation 	| Description                          	| modifier 	|
|-----------	|--------------------------------------	|----------	|
| GET       	| list all resources of the collection 	| 2        	|
| POST      	| add a resource to the collection     	| 4        	|
| GET       	| retrieve a resource (by id)          	| 8        	|
| HEAD      	| check if resource exist              	| 16       	|
| PUT       	| replace a resource                   	| 32       	|
| PATCH     	| update a resource                    	| 64       	|
| DELETE    	| delete a resource                    	| 128      	|

Some examples:
``` bash
// generate only an operation to list (GET) all locations resources
> openapi-docgen afspraken -r location[2]

// generate operation to list (GET) all locations resources and delete a resource
> openapi-docgen afspraken -r location[130]

// generate operation to list (GET) all locations resources, retrieve one by id (GET) and check if one exists (HEAD)
> openapi-docgen afspraken -r location[26]
```

**Note:** be sure to specify the modifier on the resource itself, not on the parent indicator 
``` bash
// this will not work
> openapi-docgen afspraken -r location, location[2]/address[8]

// this will not work either
> openapi-docgen afspraken -r location[2]/address[8]

// this is what you need 
> openapi-docgen afspraken -r location[2], location/address[8]

// or this works as well. Basically, the generator will use [10] as a modifier for location that is, both the list and retrieve GET operations.
// (it does not make much sense to have child resources with no way to access the parent resources)
> openapi-docgen afspraken -r location/address[8]
```

## Development
To debug:
- set `Toggle Auto Attach` to smart or always using Command Palette (`⇧⌘P`), restart Terminal, see also https://code.visualstudio.com/docs/nodejs/nodejs-debugging#_auto-attach
- open the code in Visual Studio Code. 
- set breakpoints in the code
- type `node bin/generator` in a terminal

Contribute:
- todo...

# Publish this package on npm
- increase version number in the `package.json` file
- ececute the `npm publish` command in a terminal
- FYI: to check all versions of this package so far on npm, execute `npm show @eriklenaerts/openapi-docgen versions --json`
  

# Todo:
- generate the parent GET-ters when no parent resource was given as resource itself
- validate naam van de api voor ([a-ZA-Z-]*) regex
- zoek uit welke tekens er geldig zijn voor een resource naam
- versie nummer van je API?
- testen op windows en mac van Mal
- templates van github
- target bekijken en documenteren
- whats next? verwijs naar generate sdk 
- sub-sub resource
- voeg meer tracing toe
- haal de gegenereerde file uit de git repo
- pluralize for dutch (https://github.com/betsol/numerous)

# Done:
- check dat elke resource volgens een regex matched i.e: `parent/resource[opsModifier]::tag`


