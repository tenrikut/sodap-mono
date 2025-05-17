export type Sodap = {
  "version": "0.1.0",
  "name": "sodap",
  "instructions": [
    {
      "name": "initialize",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "createUserWallet",
      "accounts": [
        {
          "name": "userProfile",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "registerStore",
      "accounts": [
        {
          "name": "store",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "name",
          "type": "string"
        },
        {
          "name": "description",
          "type": "string"
        },
        {
          "name": "logoUri",
          "type": "string"
        },
        {
          "name": "loyaltyConfig",
          "type": {
            "defined": "LoyaltyConfig"
          }
        }
      ]
    },
    {
      "name": "updateStore",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "storeId",
          "type": "publicKey"
        },
        {
          "name": "name",
          "type": {
            "option": "string"
          }
        },
        {
          "name": "description",
          "type": {
            "option": "string"
          }
        },
        {
          "name": "logoUri",
          "type": {
            "option": "string"
          }
        },
        {
          "name": "loyaltyConfig",
          "type": {
            "option": {
              "defined": "LoyaltyConfig"
            }
          }
        }
      ]
    },
    {
      "name": "createOrUpdateUserProfile",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "userId",
          "type": {
            "option": "publicKey"
          }
        },
        {
          "name": "name",
          "type": {
            "option": "string"
          }
        },
        {
          "name": "email",
          "type": {
            "option": "string"
          }
        },
        {
          "name": "phone",
          "type": {
            "option": "string"
          }
        }
      ]
    },
    {
      "name": "scanAndPurchase",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "productIds",
          "type": {
            "vec": "publicKey"
          }
        },
        {
          "name": "quantities",
          "type": {
            "vec": "u64"
          }
        },
        {
          "name": "storeId",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "registerProduct",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "productId",
          "type": "publicKey"
        },
        {
          "name": "storeId",
          "type": "publicKey"
        },
        {
          "name": "name",
          "type": "string"
        },
        {
          "name": "description",
          "type": "string"
        },
        {
          "name": "imageUri",
          "type": "string"
        },
        {
          "name": "price",
          "type": "u64"
        },
        {
          "name": "inventory",
          "type": {
            "option": "u64"
          }
        },
        {
          "name": "attributes",
          "type": {
            "vec": {
              "defined": "ProductAttribute"
            }
          }
        }
      ]
    },
    {
      "name": "updateProduct",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "productId",
          "type": "publicKey"
        },
        {
          "name": "name",
          "type": {
            "option": "string"
          }
        },
        {
          "name": "description",
          "type": {
            "option": "string"
          }
        },
        {
          "name": "imageUri",
          "type": {
            "option": "string"
          }
        },
        {
          "name": "price",
          "type": {
            "option": "u64"
          }
        },
        {
          "name": "inventory",
          "type": {
            "option": "u64"
          }
        },
        {
          "name": "attributes",
          "type": {
            "option": {
              "vec": {
                "defined": "ProductAttribute"
              }
            }
          }
        }
      ]
    },
    {
      "name": "deactivateProduct",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "productId",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "purchaseCart",
      "accounts": [
        {
          "name": "store",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "receipt",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "buyer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "storeOwner",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "escrowAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "loyaltyMintInfo",
          "isMut": true,
          "isSigner": false,
          "isOptional": true
        },
        {
          "name": "tokenMint",
          "isMut": true,
          "isSigner": false,
          "isOptional": true
        },
        {
          "name": "tokenAccount",
          "isMut": true,
          "isSigner": false,
          "isOptional": true
        },
        {
          "name": "mintAuthority",
          "isMut": true,
          "isSigner": true,
          "isOptional": true
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false,
          "isOptional": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "productIds",
          "type": {
            "vec": "publicKey"
          }
        },
        {
          "name": "quantities",
          "type": {
            "vec": "u64"
          }
        },
        {
          "name": "totalAmountPaid",
          "type": "u64"
        }
      ]
    },
    {
      "name": "addPlatformAdmin",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "adminPubkey",
          "type": "publicKey"
        },
        {
          "name": "adminName",
          "type": "string"
        },
        {
          "name": "rootPassword",
          "type": "string"
        }
      ]
    },
    {
      "name": "removePlatformAdmin",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "adminPubkey",
          "type": "publicKey"
        },
        {
          "name": "rootPassword",
          "type": "string"
        }
      ]
    },
    {
      "name": "addStoreAdmin",
      "accounts": [
        {
          "name": "store",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "storeId",
          "type": "publicKey"
        },
        {
          "name": "adminPubkey",
          "type": "publicKey"
        },
        {
          "name": "role",
          "type": {
            "defined": "AdminRoleType"
          }
        }
      ]
    },
    {
      "name": "removeStoreAdmin",
      "accounts": [
        {
          "name": "store",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "The authority must be the store owner"
          ]
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "storeId",
          "type": "publicKey"
        },
        {
          "name": "adminPubkey",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "initializeLoyaltyMint",
      "accounts": [
        {
          "name": "store",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "loyaltyMintAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenMint",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "pointsPerSol",
          "type": "u64"
        },
        {
          "name": "redemptionRate",
          "type": "u64"
        },
        {
          "name": "useToken2022",
          "type": "bool"
        }
      ]
    },
    {
      "name": "mintLoyaltyPoints",
      "accounts": [
        {
          "name": "store",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "loyaltyMintAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mintAuthority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "recipient",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "buyer",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "purchaseAmountLamports",
          "type": "u64"
        }
      ]
    },
    {
      "name": "redeemLoyaltyPoints",
      "accounts": [
        {
          "name": "store",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "loyaltyMintAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "user",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "escrowAccount",
          "isMut": true,
          "isSigner": false,
          "isOptional": true
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "pointsToRedeem",
          "type": "u64"
        },
        {
          "name": "redeemForSol",
          "type": "bool"
        }
      ]
    },
    {
      "name": "handleTransferHook",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "releaseEscrow",
      "accounts": [
        {
          "name": "store",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "storeOwner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "escrowAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "refundFromEscrow",
      "accounts": [
        {
          "name": "store",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "storeOwner",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "buyer",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "escrowAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "escrow",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "store",
            "type": "publicKey"
          },
          {
            "name": "balance",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "loyaltyMint",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "store",
            "type": "publicKey"
          },
          {
            "name": "mint",
            "type": "publicKey"
          },
          {
            "name": "authority",
            "type": "publicKey"
          },
          {
            "name": "pointsPerSol",
            "type": "u64"
          },
          {
            "name": "redemptionRate",
            "type": "u64"
          },
          {
            "name": "totalPointsIssued",
            "type": "u64"
          },
          {
            "name": "totalPointsRedeemed",
            "type": "u64"
          },
          {
            "name": "isToken2022",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "purchase",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "productIds",
            "type": {
              "array": [
                "publicKey",
                10
              ]
            }
          },
          {
            "name": "quantities",
            "type": {
              "array": [
                "u64",
                10
              ]
            }
          },
          {
            "name": "productCount",
            "type": "u8"
          },
          {
            "name": "padding",
            "type": {
              "array": [
                "u8",
                7
              ]
            }
          },
          {
            "name": "totalPaid",
            "type": "u64"
          },
          {
            "name": "gasFee",
            "type": "u64"
          },
          {
            "name": "store",
            "type": "publicKey"
          },
          {
            "name": "buyer",
            "type": "publicKey"
          },
          {
            "name": "timestamp",
            "type": "i64"
          },
          {
            "name": "status",
            "type": "u8"
          },
          {
            "name": "padding2",
            "type": {
              "array": [
                "u8",
                7
              ]
            }
          }
        ]
      }
    },
    {
      "name": "store",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "publicKey"
          },
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "description",
            "type": "string"
          },
          {
            "name": "logoUri",
            "type": "string"
          },
          {
            "name": "loyaltyConfig",
            "type": {
              "defined": "LoyaltyConfig"
            }
          },
          {
            "name": "isActive",
            "type": "bool"
          },
          {
            "name": "revenue",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "escrowBump",
            "type": "u8"
          },
          {
            "name": "adminRoles",
            "type": {
              "array": [
                {
                  "defined": "AdminRole"
                },
                3
              ]
            }
          },
          {
            "name": "adminCount",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "userProfile",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "publicKey"
          },
          {
            "name": "userId",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "padding1",
            "type": {
              "array": [
                "u8",
                24
              ]
            }
          },
          {
            "name": "deliveryAddress",
            "type": {
              "array": [
                "u8",
                128
              ]
            }
          },
          {
            "name": "padding2",
            "type": {
              "array": [
                "u8",
                2
              ]
            }
          },
          {
            "name": "preferredStore",
            "type": "publicKey"
          },
          {
            "name": "totalPurchases",
            "type": "u64"
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "ProductAttribute",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "name",
            "type": {
              "array": [
                "u8",
                64
              ]
            }
          },
          {
            "name": "value",
            "type": {
              "array": [
                "u8",
                128
              ]
            }
          },
          {
            "name": "padding",
            "type": {
              "array": [
                "u8",
                8
              ]
            }
          }
        ]
      }
    },
    {
      "name": "AdminRole",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "adminPubkey",
            "type": "publicKey"
          },
          {
            "name": "roleType",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "AdminRoleType",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Owner"
          },
          {
            "name": "Manager"
          },
          {
            "name": "Viewer"
          }
        ]
      }
    },
    {
      "name": "LoyaltyConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "pointsPerDollar",
            "type": "u64"
          },
          {
            "name": "redemptionRate",
            "type": "u64"
          }
        ]
      }
    }
  ],
  "events": [
    {
      "name": "CartPurchased",
      "fields": [
        {
          "name": "storeId",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "buyerId",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "productUuids",
          "type": {
            "vec": {
              "array": [
                "u8",
                16
              ]
            }
          },
          "index": false
        },
        {
          "name": "quantities",
          "type": {
            "vec": "u64"
          },
          "index": false
        },
        {
          "name": "totalPaid",
          "type": "u64",
          "index": false
        },
        {
          "name": "gasFee",
          "type": "u64",
          "index": false
        },
        {
          "name": "timestamp",
          "type": "i64",
          "index": false
        },
        {
          "name": "productCount",
          "type": "u8",
          "index": false
        }
      ]
    },
    {
      "name": "LoyaltyPointsEarned",
      "fields": [
        {
          "name": "user",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "storeId",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "pointsEarned",
          "type": "u64",
          "index": false
        },
        {
          "name": "totalPoints",
          "type": "u64",
          "index": false
        },
        {
          "name": "timestamp",
          "type": "i64",
          "index": false
        }
      ]
    },
    {
      "name": "LoyaltyPointsRedeemed",
      "fields": [
        {
          "name": "user",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "storeId",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "pointsRedeemed",
          "type": "u64",
          "index": false
        },
        {
          "name": "discountValue",
          "type": "u64",
          "index": false
        },
        {
          "name": "remainingPoints",
          "type": "u64",
          "index": false
        },
        {
          "name": "timestamp",
          "type": "i64",
          "index": false
        }
      ]
    },
    {
      "name": "LoyaltyTokensMinted",
      "fields": [
        {
          "name": "user",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "amount",
          "type": "u64",
          "index": false
        },
        {
          "name": "remainingPoints",
          "type": "u64",
          "index": false
        },
        {
          "name": "timestamp",
          "type": "i64",
          "index": false
        }
      ]
    },
    {
      "name": "PlatformAdminAdded",
      "fields": [
        {
          "name": "adminPubkey",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "addedAt",
          "type": "i64",
          "index": false
        }
      ]
    },
    {
      "name": "PlatformAdminRemoved",
      "fields": [
        {
          "name": "adminPubkey",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "removedAt",
          "type": "i64",
          "index": false
        }
      ]
    },
    {
      "name": "PurchaseCompleted",
      "fields": [
        {
          "name": "store",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "buyer",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "totalAmount",
          "type": "u64",
          "index": false
        },
        {
          "name": "timestamp",
          "type": "i64",
          "index": false
        },
        {
          "name": "loyaltyPointsEarned",
          "type": "u64",
          "index": false
        }
      ]
    },
    {
      "name": "StoreAdminRemoved",
      "fields": [
        {
          "name": "store",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "admin",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "removedAt",
          "type": "i64",
          "index": false
        }
      ]
    },
    {
      "name": "UserProfileUpdated",
      "fields": [
        {
          "name": "walletAddress",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "userId",
          "type": "string",
          "index": false
        },
        {
          "name": "updatedAt",
          "type": "i64",
          "index": false
        }
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "InvalidPrice",
      "msg": "Invalid price"
    },
    {
      "code": 6001,
      "name": "InvalidStock",
      "msg": "Invalid stock"
    },
    {
      "code": 6002,
      "name": "OutOfStock",
      "msg": "Product is out of stock"
    },
    {
      "code": 6003,
      "name": "InsufficientPayment",
      "msg": "Insufficient payment"
    },
    {
      "code": 6004,
      "name": "StockUnderflow",
      "msg": "Stock underflow"
    },
    {
      "code": 6005,
      "name": "Unauthorized",
      "msg": "Unauthorized"
    },
    {
      "code": 6006,
      "name": "CartEmpty",
      "msg": "Cart is empty"
    },
    {
      "code": 6007,
      "name": "InvalidCart",
      "msg": "Invalid cart (mismatched product and quantity arrays)"
    },
    {
      "code": 6008,
      "name": "ProductNotFound",
      "msg": "Product not found"
    },
    {
      "code": 6009,
      "name": "InsufficientStock",
      "msg": "Insufficient stock"
    },
    {
      "code": 6010,
      "name": "PriceOverflow",
      "msg": "Price overflow when summing cart"
    },
    {
      "code": 6011,
      "name": "AdminAlreadyExists",
      "msg": "Admin already exists"
    },
    {
      "code": 6012,
      "name": "CannotRemoveOwner",
      "msg": "Cannot remove owner"
    },
    {
      "code": 6013,
      "name": "StoreNotFound",
      "msg": "Store not found"
    },
    {
      "code": 6014,
      "name": "UnauthorizedStoreAccess",
      "msg": "Unauthorized store access"
    },
    {
      "code": 6015,
      "name": "AdminNotFound",
      "msg": "Admin not found"
    },
    {
      "code": 6016,
      "name": "UserNotFound",
      "msg": "User not found"
    },
    {
      "code": 6017,
      "name": "ArithmeticError",
      "msg": "Arithmetic error"
    },
    {
      "code": 6018,
      "name": "InvalidStoreId",
      "msg": "Invalid store ID"
    },
    {
      "code": 6019,
      "name": "InvalidProductId",
      "msg": "Invalid product ID"
    },
    {
      "code": 6020,
      "name": "InvalidAdminId",
      "msg": "Invalid admin ID"
    },
    {
      "code": 6021,
      "name": "InvalidLoyaltyConfig",
      "msg": "Invalid loyalty configuration"
    },
    {
      "code": 6022,
      "name": "StoreInactive",
      "msg": "Store is inactive"
    },
    {
      "code": 6023,
      "name": "InsufficientLoyaltyPoints",
      "msg": "Insufficient loyalty points"
    },
    {
      "code": 6024,
      "name": "LoyaltyProgramInactive",
      "msg": "Loyalty program is inactive"
    },
    {
      "code": 6025,
      "name": "InvalidParameters",
      "msg": "Invalid parameters"
    },
    {
      "code": 6026,
      "name": "InsufficientFunds",
      "msg": "Insufficient funds"
    },
    {
      "code": 6027,
      "name": "InvalidMetadataUri",
      "msg": "Invalid metadata URI"
    },
    {
      "code": 6028,
      "name": "InvalidAdminRole",
      "msg": "Invalid admin role"
    },
    {
      "code": 6029,
      "name": "InvalidStore",
      "msg": "Invalid store"
    },
    {
      "code": 6030,
      "name": "InvalidState",
      "msg": "Invalid program state"
    },
    {
      "code": 6031,
      "name": "EscrowNotFound",
      "msg": "Escrow account not found"
    },
    {
      "code": 6032,
      "name": "LoyaltyMintNotFound",
      "msg": "Loyalty mint not found"
    },
    {
      "code": 6033,
      "name": "InvalidLoyaltyPoints",
      "msg": "Invalid loyalty points"
    },
    {
      "code": 6034,
      "name": "TransferHookError",
      "msg": "Transfer hook error"
    },
    {
      "code": 6035,
      "name": "MaxAdminsReached",
      "msg": "Maximum number of admins (10) reached for this store"
    },
    {
      "code": 6036,
      "name": "InvalidMint",
      "msg": "Invalid loyalty mint account"
    },
    {
      "code": 6037,
      "name": "InvalidRedemption",
      "msg": "Invalid redemption amount"
    },
    {
      "code": 6038,
      "name": "InsufficientEscrowBalance",
      "msg": "Insufficient escrow balance"
    },
    {
      "code": 6039,
      "name": "StringTooLong",
      "msg": "String is too long"
    },
    {
      "code": 6040,
      "name": "CartTooLarge",
      "msg": "Cart is too large"
    },
    {
      "code": 6041,
      "name": "LoyaltyPointsOverflow",
      "msg": "Loyalty points overflow"
    }
  ]
};

export const IDL: Sodap = {
  "version": "0.1.0",
  "name": "sodap",
  "instructions": [
    {
      "name": "initialize",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "createUserWallet",
      "accounts": [
        {
          "name": "userProfile",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "registerStore",
      "accounts": [
        {
          "name": "store",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "name",
          "type": "string"
        },
        {
          "name": "description",
          "type": "string"
        },
        {
          "name": "logoUri",
          "type": "string"
        },
        {
          "name": "loyaltyConfig",
          "type": {
            "defined": "LoyaltyConfig"
          }
        }
      ]
    },
    {
      "name": "updateStore",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "storeId",
          "type": "publicKey"
        },
        {
          "name": "name",
          "type": {
            "option": "string"
          }
        },
        {
          "name": "description",
          "type": {
            "option": "string"
          }
        },
        {
          "name": "logoUri",
          "type": {
            "option": "string"
          }
        },
        {
          "name": "loyaltyConfig",
          "type": {
            "option": {
              "defined": "LoyaltyConfig"
            }
          }
        }
      ]
    },
    {
      "name": "createOrUpdateUserProfile",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "userId",
          "type": {
            "option": "publicKey"
          }
        },
        {
          "name": "name",
          "type": {
            "option": "string"
          }
        },
        {
          "name": "email",
          "type": {
            "option": "string"
          }
        },
        {
          "name": "phone",
          "type": {
            "option": "string"
          }
        }
      ]
    },
    {
      "name": "scanAndPurchase",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "productIds",
          "type": {
            "vec": "publicKey"
          }
        },
        {
          "name": "quantities",
          "type": {
            "vec": "u64"
          }
        },
        {
          "name": "storeId",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "registerProduct",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "productId",
          "type": "publicKey"
        },
        {
          "name": "storeId",
          "type": "publicKey"
        },
        {
          "name": "name",
          "type": "string"
        },
        {
          "name": "description",
          "type": "string"
        },
        {
          "name": "imageUri",
          "type": "string"
        },
        {
          "name": "price",
          "type": "u64"
        },
        {
          "name": "inventory",
          "type": {
            "option": "u64"
          }
        },
        {
          "name": "attributes",
          "type": {
            "vec": {
              "defined": "ProductAttribute"
            }
          }
        }
      ]
    },
    {
      "name": "updateProduct",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "productId",
          "type": "publicKey"
        },
        {
          "name": "name",
          "type": {
            "option": "string"
          }
        },
        {
          "name": "description",
          "type": {
            "option": "string"
          }
        },
        {
          "name": "imageUri",
          "type": {
            "option": "string"
          }
        },
        {
          "name": "price",
          "type": {
            "option": "u64"
          }
        },
        {
          "name": "inventory",
          "type": {
            "option": "u64"
          }
        },
        {
          "name": "attributes",
          "type": {
            "option": {
              "vec": {
                "defined": "ProductAttribute"
              }
            }
          }
        }
      ]
    },
    {
      "name": "deactivateProduct",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "productId",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "purchaseCart",
      "accounts": [
        {
          "name": "store",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "receipt",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "buyer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "storeOwner",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "escrowAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "loyaltyMintInfo",
          "isMut": true,
          "isSigner": false,
          "isOptional": true
        },
        {
          "name": "tokenMint",
          "isMut": true,
          "isSigner": false,
          "isOptional": true
        },
        {
          "name": "tokenAccount",
          "isMut": true,
          "isSigner": false,
          "isOptional": true
        },
        {
          "name": "mintAuthority",
          "isMut": true,
          "isSigner": true,
          "isOptional": true
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false,
          "isOptional": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "productIds",
          "type": {
            "vec": "publicKey"
          }
        },
        {
          "name": "quantities",
          "type": {
            "vec": "u64"
          }
        },
        {
          "name": "totalAmountPaid",
          "type": "u64"
        }
      ]
    },
    {
      "name": "addPlatformAdmin",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "adminPubkey",
          "type": "publicKey"
        },
        {
          "name": "adminName",
          "type": "string"
        },
        {
          "name": "rootPassword",
          "type": "string"
        }
      ]
    },
    {
      "name": "removePlatformAdmin",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "adminPubkey",
          "type": "publicKey"
        },
        {
          "name": "rootPassword",
          "type": "string"
        }
      ]
    },
    {
      "name": "addStoreAdmin",
      "accounts": [
        {
          "name": "store",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "storeId",
          "type": "publicKey"
        },
        {
          "name": "adminPubkey",
          "type": "publicKey"
        },
        {
          "name": "role",
          "type": {
            "defined": "AdminRoleType"
          }
        }
      ]
    },
    {
      "name": "removeStoreAdmin",
      "accounts": [
        {
          "name": "store",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "The authority must be the store owner"
          ]
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "storeId",
          "type": "publicKey"
        },
        {
          "name": "adminPubkey",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "initializeLoyaltyMint",
      "accounts": [
        {
          "name": "store",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "loyaltyMintAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenMint",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "pointsPerSol",
          "type": "u64"
        },
        {
          "name": "redemptionRate",
          "type": "u64"
        },
        {
          "name": "useToken2022",
          "type": "bool"
        }
      ]
    },
    {
      "name": "mintLoyaltyPoints",
      "accounts": [
        {
          "name": "store",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "loyaltyMintAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mintAuthority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "recipient",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "buyer",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "purchaseAmountLamports",
          "type": "u64"
        }
      ]
    },
    {
      "name": "redeemLoyaltyPoints",
      "accounts": [
        {
          "name": "store",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "loyaltyMintAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "user",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "escrowAccount",
          "isMut": true,
          "isSigner": false,
          "isOptional": true
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "pointsToRedeem",
          "type": "u64"
        },
        {
          "name": "redeemForSol",
          "type": "bool"
        }
      ]
    },
    {
      "name": "handleTransferHook",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "releaseEscrow",
      "accounts": [
        {
          "name": "store",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "storeOwner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "escrowAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "refundFromEscrow",
      "accounts": [
        {
          "name": "store",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "storeOwner",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "buyer",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "escrowAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "escrow",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "store",
            "type": "publicKey"
          },
          {
            "name": "balance",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "loyaltyMint",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "store",
            "type": "publicKey"
          },
          {
            "name": "mint",
            "type": "publicKey"
          },
          {
            "name": "authority",
            "type": "publicKey"
          },
          {
            "name": "pointsPerSol",
            "type": "u64"
          },
          {
            "name": "redemptionRate",
            "type": "u64"
          },
          {
            "name": "totalPointsIssued",
            "type": "u64"
          },
          {
            "name": "totalPointsRedeemed",
            "type": "u64"
          },
          {
            "name": "isToken2022",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "purchase",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "productIds",
            "type": {
              "array": [
                "publicKey",
                10
              ]
            }
          },
          {
            "name": "quantities",
            "type": {
              "array": [
                "u64",
                10
              ]
            }
          },
          {
            "name": "productCount",
            "type": "u8"
          },
          {
            "name": "padding",
            "type": {
              "array": [
                "u8",
                7
              ]
            }
          },
          {
            "name": "totalPaid",
            "type": "u64"
          },
          {
            "name": "gasFee",
            "type": "u64"
          },
          {
            "name": "store",
            "type": "publicKey"
          },
          {
            "name": "buyer",
            "type": "publicKey"
          },
          {
            "name": "timestamp",
            "type": "i64"
          },
          {
            "name": "status",
            "type": "u8"
          },
          {
            "name": "padding2",
            "type": {
              "array": [
                "u8",
                7
              ]
            }
          }
        ]
      }
    },
    {
      "name": "store",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "publicKey"
          },
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "description",
            "type": "string"
          },
          {
            "name": "logoUri",
            "type": "string"
          },
          {
            "name": "loyaltyConfig",
            "type": {
              "defined": "LoyaltyConfig"
            }
          },
          {
            "name": "isActive",
            "type": "bool"
          },
          {
            "name": "revenue",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "escrowBump",
            "type": "u8"
          },
          {
            "name": "adminRoles",
            "type": {
              "array": [
                {
                  "defined": "AdminRole"
                },
                3
              ]
            }
          },
          {
            "name": "adminCount",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "userProfile",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "publicKey"
          },
          {
            "name": "userId",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "padding1",
            "type": {
              "array": [
                "u8",
                24
              ]
            }
          },
          {
            "name": "deliveryAddress",
            "type": {
              "array": [
                "u8",
                128
              ]
            }
          },
          {
            "name": "padding2",
            "type": {
              "array": [
                "u8",
                2
              ]
            }
          },
          {
            "name": "preferredStore",
            "type": "publicKey"
          },
          {
            "name": "totalPurchases",
            "type": "u64"
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "ProductAttribute",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "name",
            "type": {
              "array": [
                "u8",
                64
              ]
            }
          },
          {
            "name": "value",
            "type": {
              "array": [
                "u8",
                128
              ]
            }
          },
          {
            "name": "padding",
            "type": {
              "array": [
                "u8",
                8
              ]
            }
          }
        ]
      }
    },
    {
      "name": "AdminRole",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "adminPubkey",
            "type": "publicKey"
          },
          {
            "name": "roleType",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "AdminRoleType",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Owner"
          },
          {
            "name": "Manager"
          },
          {
            "name": "Viewer"
          }
        ]
      }
    },
    {
      "name": "LoyaltyConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "pointsPerDollar",
            "type": "u64"
          },
          {
            "name": "redemptionRate",
            "type": "u64"
          }
        ]
      }
    }
  ],
  "events": [
    {
      "name": "CartPurchased",
      "fields": [
        {
          "name": "storeId",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "buyerId",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "productUuids",
          "type": {
            "vec": {
              "array": [
                "u8",
                16
              ]
            }
          },
          "index": false
        },
        {
          "name": "quantities",
          "type": {
            "vec": "u64"
          },
          "index": false
        },
        {
          "name": "totalPaid",
          "type": "u64",
          "index": false
        },
        {
          "name": "gasFee",
          "type": "u64",
          "index": false
        },
        {
          "name": "timestamp",
          "type": "i64",
          "index": false
        },
        {
          "name": "productCount",
          "type": "u8",
          "index": false
        }
      ]
    },
    {
      "name": "LoyaltyPointsEarned",
      "fields": [
        {
          "name": "user",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "storeId",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "pointsEarned",
          "type": "u64",
          "index": false
        },
        {
          "name": "totalPoints",
          "type": "u64",
          "index": false
        },
        {
          "name": "timestamp",
          "type": "i64",
          "index": false
        }
      ]
    },
    {
      "name": "LoyaltyPointsRedeemed",
      "fields": [
        {
          "name": "user",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "storeId",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "pointsRedeemed",
          "type": "u64",
          "index": false
        },
        {
          "name": "discountValue",
          "type": "u64",
          "index": false
        },
        {
          "name": "remainingPoints",
          "type": "u64",
          "index": false
        },
        {
          "name": "timestamp",
          "type": "i64",
          "index": false
        }
      ]
    },
    {
      "name": "LoyaltyTokensMinted",
      "fields": [
        {
          "name": "user",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "amount",
          "type": "u64",
          "index": false
        },
        {
          "name": "remainingPoints",
          "type": "u64",
          "index": false
        },
        {
          "name": "timestamp",
          "type": "i64",
          "index": false
        }
      ]
    },
    {
      "name": "PlatformAdminAdded",
      "fields": [
        {
          "name": "adminPubkey",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "addedAt",
          "type": "i64",
          "index": false
        }
      ]
    },
    {
      "name": "PlatformAdminRemoved",
      "fields": [
        {
          "name": "adminPubkey",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "removedAt",
          "type": "i64",
          "index": false
        }
      ]
    },
    {
      "name": "PurchaseCompleted",
      "fields": [
        {
          "name": "store",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "buyer",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "totalAmount",
          "type": "u64",
          "index": false
        },
        {
          "name": "timestamp",
          "type": "i64",
          "index": false
        },
        {
          "name": "loyaltyPointsEarned",
          "type": "u64",
          "index": false
        }
      ]
    },
    {
      "name": "StoreAdminRemoved",
      "fields": [
        {
          "name": "store",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "admin",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "removedAt",
          "type": "i64",
          "index": false
        }
      ]
    },
    {
      "name": "UserProfileUpdated",
      "fields": [
        {
          "name": "walletAddress",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "userId",
          "type": "string",
          "index": false
        },
        {
          "name": "updatedAt",
          "type": "i64",
          "index": false
        }
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "InvalidPrice",
      "msg": "Invalid price"
    },
    {
      "code": 6001,
      "name": "InvalidStock",
      "msg": "Invalid stock"
    },
    {
      "code": 6002,
      "name": "OutOfStock",
      "msg": "Product is out of stock"
    },
    {
      "code": 6003,
      "name": "InsufficientPayment",
      "msg": "Insufficient payment"
    },
    {
      "code": 6004,
      "name": "StockUnderflow",
      "msg": "Stock underflow"
    },
    {
      "code": 6005,
      "name": "Unauthorized",
      "msg": "Unauthorized"
    },
    {
      "code": 6006,
      "name": "CartEmpty",
      "msg": "Cart is empty"
    },
    {
      "code": 6007,
      "name": "InvalidCart",
      "msg": "Invalid cart (mismatched product and quantity arrays)"
    },
    {
      "code": 6008,
      "name": "ProductNotFound",
      "msg": "Product not found"
    },
    {
      "code": 6009,
      "name": "InsufficientStock",
      "msg": "Insufficient stock"
    },
    {
      "code": 6010,
      "name": "PriceOverflow",
      "msg": "Price overflow when summing cart"
    },
    {
      "code": 6011,
      "name": "AdminAlreadyExists",
      "msg": "Admin already exists"
    },
    {
      "code": 6012,
      "name": "CannotRemoveOwner",
      "msg": "Cannot remove owner"
    },
    {
      "code": 6013,
      "name": "StoreNotFound",
      "msg": "Store not found"
    },
    {
      "code": 6014,
      "name": "UnauthorizedStoreAccess",
      "msg": "Unauthorized store access"
    },
    {
      "code": 6015,
      "name": "AdminNotFound",
      "msg": "Admin not found"
    },
    {
      "code": 6016,
      "name": "UserNotFound",
      "msg": "User not found"
    },
    {
      "code": 6017,
      "name": "ArithmeticError",
      "msg": "Arithmetic error"
    },
    {
      "code": 6018,
      "name": "InvalidStoreId",
      "msg": "Invalid store ID"
    },
    {
      "code": 6019,
      "name": "InvalidProductId",
      "msg": "Invalid product ID"
    },
    {
      "code": 6020,
      "name": "InvalidAdminId",
      "msg": "Invalid admin ID"
    },
    {
      "code": 6021,
      "name": "InvalidLoyaltyConfig",
      "msg": "Invalid loyalty configuration"
    },
    {
      "code": 6022,
      "name": "StoreInactive",
      "msg": "Store is inactive"
    },
    {
      "code": 6023,
      "name": "InsufficientLoyaltyPoints",
      "msg": "Insufficient loyalty points"
    },
    {
      "code": 6024,
      "name": "LoyaltyProgramInactive",
      "msg": "Loyalty program is inactive"
    },
    {
      "code": 6025,
      "name": "InvalidParameters",
      "msg": "Invalid parameters"
    },
    {
      "code": 6026,
      "name": "InsufficientFunds",
      "msg": "Insufficient funds"
    },
    {
      "code": 6027,
      "name": "InvalidMetadataUri",
      "msg": "Invalid metadata URI"
    },
    {
      "code": 6028,
      "name": "InvalidAdminRole",
      "msg": "Invalid admin role"
    },
    {
      "code": 6029,
      "name": "InvalidStore",
      "msg": "Invalid store"
    },
    {
      "code": 6030,
      "name": "InvalidState",
      "msg": "Invalid program state"
    },
    {
      "code": 6031,
      "name": "EscrowNotFound",
      "msg": "Escrow account not found"
    },
    {
      "code": 6032,
      "name": "LoyaltyMintNotFound",
      "msg": "Loyalty mint not found"
    },
    {
      "code": 6033,
      "name": "InvalidLoyaltyPoints",
      "msg": "Invalid loyalty points"
    },
    {
      "code": 6034,
      "name": "TransferHookError",
      "msg": "Transfer hook error"
    },
    {
      "code": 6035,
      "name": "MaxAdminsReached",
      "msg": "Maximum number of admins (10) reached for this store"
    },
    {
      "code": 6036,
      "name": "InvalidMint",
      "msg": "Invalid loyalty mint account"
    },
    {
      "code": 6037,
      "name": "InvalidRedemption",
      "msg": "Invalid redemption amount"
    },
    {
      "code": 6038,
      "name": "InsufficientEscrowBalance",
      "msg": "Insufficient escrow balance"
    },
    {
      "code": 6039,
      "name": "StringTooLong",
      "msg": "String is too long"
    },
    {
      "code": 6040,
      "name": "CartTooLarge",
      "msg": "Cart is too large"
    },
    {
      "code": 6041,
      "name": "LoyaltyPointsOverflow",
      "msg": "Loyalty points overflow"
    }
  ]
};
