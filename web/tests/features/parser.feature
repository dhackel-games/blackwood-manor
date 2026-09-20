# parser.feature. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-09-13.082:acoven.

@unit
Feature: Player command parsing
  Player phrasing must resolve to stable engine commands, and command chains
  must preserve their original order.

  Scenario: Supported commands have the expected structure
    Then the following commands parse as:
      | input                               | verb    | direct    | preposition | indirect  |
      | n                                   | go      | north     | [none]      | [none]    |
      | g                                   | again   | [none]    | [none]      | [none]    |
      | g kitchen                           | go      | kitchen   | [none]      | [none]    |
      | northeast                           | go      | ne        | [none]      | [none]    |
      | northwest                           | go      | nw        | [none]      | [none]    |
      | southeast                           | go      | se        | [none]      | [none]    |
      | southwest                           | go      | sw        | [none]      | [none]    |
      | u                                   | go      | up        | [none]      | [none]    |
      | dn                                  | go      | down      | [none]      | [none]    |
      | u talisman                          | use     | talisman  | [none]      | [none]    |
      | take the brass key                  | take    | brass key | [none]      | [none]    |
      | t rope                              | take    | rope      | [none]      | [none]    |
      | grab brass key                      | take    | brass key | [none]      | [none]    |
      | get all from box                    | take    | all       | from        | box       |
      | take all from rq                    | take    | all       | from        | rq        |
      | unlock the oak door with the brass key | unlock | oak door | with      | brass key |
      | unlock front d w/iron               | unlock | front door | with       | iron       |
      | un frontd w/iron                    | unlock | frontd     | with       | iron       |
      | lk frontd w/iron                    | lock   | frontd      | with       | iron       |
      | unlock front d w/ iron              | unlock | front door | with       | iron       |
      | fly grand br                        | go      | grand bedroom | [none]   | [none]     |
      | look                                | look    | [none]    | [none]      | [none]    |
      | look at brass key                   | examine | brass key | [none]      | [none]    |
      | look in mirror at kitchen           | examine | mirror    | at          | kitchen   |
      | show library in mirror              | show    | library   | in          | mirror    |
      | look brass key                      | examine | brass key | [none]      | [none]    |
      | search brass key                    | examine | brass key | [none]      | [none]    |
      | ex brass key                        | examine | brass key | [none]      | [none]    |
      | look at                             | look    | [none]    | [none]      | [none]    |
      | turn on lamp                        | on      | lamp      | [none]      | [none]    |
      | o box                               | open    | box       | [none]      | [none]    |
      | c box                               | close   | box       | [none]      | [none]    |
      | shut box                            | close   | box       | [none]      | [none]    |
      | yes                                 | yes     | [none]    | [none]      | [none]    |
      | use talisman                        | use     | talisman  | [none]      | [none]    |
      | no                                  | no      | [none]    | [none]      | [none]    |
      | 7 3 9                               | code    | 7 3 9     | [none]      | [none]    |
      | talk to dragon                      | talk    | dragon    | [none]      | [none]    |
      | wake up dragon                      | wake    | dragon    | [none]      | [none]    |
      | offer apple to dragon               | give    | apple     | to          | dragon    |
      | put apple on dragon                 | put     | apple     | on          | dragon    |
      | put all in rq                       | put     | all       | in          | rq        |
      | drop all in rq                      | put     | all       | in          | rq        |
      | place emerald gem in middle slot    | put     | emerald gem | in        | middle slot |
      | say "foo"                           | say     | "foo"     | [none]      | [none]    |
      | say d                               | say     | d         | [none]      | [none]    |
      | yell foo                            | say     | foo       | [none]      | [none]    |
      | leave                               | go      | out       | [none]      | [none]    |
      | exit                                | go      | out       | [none]      | [none]    |
      | enter                               | go      | in        | [none]      | [none]    |
      | in door                             | enter   | door      | [none]      | [none]    |

  Scenario: Invalid commands report parser errors
    Then parsing "[empty]" fails with "empty"
    And parsing "frobnicate the widget" fails with "unknown-verb"

  Scenario: Command chains split only at supported separators
    Then the following command lines split as:
      | input                      | commands                         |
      | n; open box; get key       | n / open box / get key            |
      | n. s. e                    | n / s / e                         |
      | take key then go north     | take key / go north               |
      | n, s                       | n / s                             |
      | look                       | look                              |
      | [empty]                    | [none]                            |
      | open thenardier            | open thenardier                   |

# end parser.feature
