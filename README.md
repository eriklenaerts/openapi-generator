# Open API Document Generator
Generate new Open API documents based on your own API REST guidelines. 

## Basic usage
``` bash
> npm install -g @eriklenaerts/openapi-docgen
> cd your-app
> openapi-docgen
```

## Features
* Generate OAS (aka swagger) documents in JSON or YAML
* Provide resource names and it will deal with pluralisaton (English only)
* Select the operations GET, POST, PUT, ... you like for each resource
* Classify resources in specified tags
* Generates placeholder schema's for every resource 
* Interactive prompt or provide command line arguments
* Generate OAS documents based on your own specifications, there's one included for the [Digipolis API System 7.0](https://antwerp-api.digipolis.be/). 
* Create your own templates (based on [Handlebars](https://handlebarsjs.com/))

## Examples
``` bash
// Show the commandline help
> openapi-docgen -h     

//Generate an API called 'Appointment' the rest will be prompted
> openapi-docgen Appointment       

//Generate an API called 'Appointment' with two resources 'location' and 'service'
> openapi-docgen Appointment -r 'location, service'     

//Generate an API called 'Appointment' with two resources 'location' and 'tenant', the latter will be classified under the `System` tag
> openapi-docgen Appointment -r 'location, tenant::system'  

//Generate an API called 'Appointment' with two resources 'location' and a sub resource 'address'
> openapi-docgen Appointment -r 'location, location/address'    

//Generate an API called 'Appointment' with a resource 'address' as a sub resource, a minimal parent 'location' resource will be added with a list and read operation
> openapi-docgen Appointment -r 'location/address'    

//Generate an API called 'Appointment' with two resources 'location' and 'service'. Only the list (GET collection) will be generated for the location. check out the operations modifier below
> openapi-docgen Appointment -r 'location[2], service'     
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
> openapi-docgen Appointment -r 'location[2]'

// generate operation to list (GET) all locations resources and delete a resource
> openapi-docgen Appointment -r 'location[130]'

// generate operation to list (GET) all locations resources, retrieve one by id (GET) and check if one exists (HEAD)
> openapi-docgen Appointment -r 'location[26]'
```

**Note:** be sure to specify the modifier on the resource itself, not on the parent indicator 
``` bash
// this will not work
> openapi-docgen Appointment -r 'location, location[2]/address[8]'

// this will not work either
> openapi-docgen Appointment -r 'location[2]/address[8]'

// this is what you need 
> openapi-docgen Appointment -r 'location[2], location/address[8]'

// or this works as well. Basically, the generator will use [10] as a modifier for location that is, both the list and retrieve GET operations.
// (it does not make much sense to have child resources with no way to access the parent resources)
> openapi-docgen Appointment -r 'location/address[8]'
```

## Development
To debug:
- set `Toggle Auto Attach` to smart or always using Command Palette (`⇧⌘P`), restart Terminal, see also https://code.visualstudio.com/docs/nodejs/nodejs-debugging#_auto-attach
- open the code in Visual Studio Code. 
- set breakpoints in the code
- type `node bin/generator` in a terminal

## Contribute:
- Fork away or sent Pull Requests :v:

# Publish this package on npm
- increase version number in the `package.json` file
- ececute the `npm publish` command in a terminal
- FYI: to check all versions of this package so far on npm, execute `npm show @eriklenaerts/openapi-docgen versions --json`
