/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/sodap.json`.
 */
export type Sodap = {
  address: "4eLJ3QGiNrPN6UUr2fNxq6tUZqFdBMVpXkL2MhsKNriv";
  metadata: {
    name: "sodap";
    version: "0.1.0";
    spec: "0.1.0";
    description: "Created with Anchor";
  };
  instructions: [
    {
      name: "addPlatformAdmin";
      discriminator: [161, 172, 63, 212, 254, 209, 243, 34];
      accounts: [
        {
          name: "payer";
          writable: true;
          signer: true;
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        }
      ];
      args: [
        {
          name: "adminPubkey";
          type: "pubkey";
        },
        {
          name: "adminName";
          type: "string";
        },
        {
          name: "rootPassword";
          type: "string";
        }
      ];
    },
    {
      name: "addStoreAdmin";
      discriminator: [198, 151, 163, 65, 104, 162, 70, 38];
      accounts: [
        {
          name: "store";
          writable: true;
        },
        {
          name: "authority";
          signer: true;
        },
        {
          name: "payer";
          writable: true;
          signer: true;
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        }
      ];
      args: [
        {
          name: "storeId";
          type: "pubkey";
        },
        {
          name: "adminPubkey";
          type: "pubkey";
        },
        {
          name: "role";
          type: {
            defined: {
              name: "adminRoleType";
            };
          };
        }
      ];
    },
    {
      name: "createOrUpdateUserProfile";
      discriminator: [179, 73, 133, 221, 229, 96, 217, 31];
      accounts: [
        {
          name: "payer";
          writable: true;
          signer: true;
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        }
      ];
      args: [
        {
          name: "userId";
          type: {
            option: "pubkey";
          };
        },
        {
          name: "name";
          type: {
            option: "string";
          };
        },
        {
          name: "email";
          type: {
            option: "string";
          };
        },
        {
          name: "phone";
          type: {
            option: "string";
          };
        }
      ];
    },
    {
      name: "deactivateProduct";
      discriminator: [94, 118, 5, 80, 69, 37, 75, 96];
      accounts: [
        {
          name: "payer";
          writable: true;
          signer: true;
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        }
      ];
      args: [
        {
          name: "productId";
          type: "pubkey";
        }
      ];
    },
    {
      name: "handleTransferHook";
      discriminator: [190, 171, 237, 164, 179, 74, 238, 183];
      accounts: [
        {
          name: "payer";
          writable: true;
          signer: true;
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        }
      ];
      args: [
        {
          name: "amount";
          type: "u64";
        }
      ];
    },
    {
      name: "initialize";
      discriminator: [175, 175, 109, 31, 13, 152, 155, 237];
      accounts: [
        {
          name: "payer";
          writable: true;
          signer: true;
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        }
      ];
      args: [];
    },
    {
      name: "initializeLoyaltyMint";
      discriminator: [124, 218, 206, 49, 20, 69, 141, 248];
      accounts: [
        {
          name: "store";
          writable: true;
        },
        {
          name: "loyaltyMintAccount";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  108,
                  111,
                  121,
                  97,
                  108,
                  116,
                  121,
                  95,
                  109,
                  105,
                  110,
                  116
                ];
              },
              {
                kind: "account";
                path: "store";
              }
            ];
          };
        },
        {
          name: "tokenMint";
          writable: true;
          signer: true;
        },
        {
          name: "payer";
          writable: true;
          signer: true;
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        },
        {
          name: "tokenProgram";
          address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
        },
        {
          name: "rent";
          address: "SysvarRent111111111111111111111111111111111";
        }
      ];
      args: [
        {
          name: "pointsPerSol";
          type: "u64";
        },
        {
          name: "redemptionRate";
          type: "u64";
        },
        {
          name: "useToken2022";
          type: "bool";
        }
      ];
    },
    {
      name: "mintLoyaltyPoints";
      discriminator: [179, 168, 105, 41, 246, 68, 35, 120];
      accounts: [
        {
          name: "store";
          writable: true;
        },
        {
          name: "loyaltyMintAccount";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  108,
                  111,
                  121,
                  97,
                  108,
                  116,
                  121,
                  95,
                  109,
                  105,
                  110,
                  116
                ];
              },
              {
                kind: "account";
                path: "store";
              }
            ];
          };
        },
        {
          name: "tokenMint";
          writable: true;
        },
        {
          name: "tokenAccount";
          writable: true;
        },
        {
          name: "mintAuthority";
          writable: true;
          signer: true;
        },
        {
          name: "recipient";
        },
        {
          name: "buyer";
        },
        {
          name: "tokenProgram";
          address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        }
      ];
      args: [
        {
          name: "purchaseAmountLamports";
          type: "u64";
        }
      ];
    },
    {
      name: "purchaseCart";
      discriminator: [196, 33, 229, 130, 137, 89, 154, 199];
      accounts: [
        {
          name: "store";
          writable: true;
        },
        {
          name: "receipt";
          writable: true;
          signer: true;
        },
        {
          name: "buyer";
          writable: true;
          signer: true;
        },
        {
          name: "storeOwner";
          writable: true;
        },
        {
          name: "escrowAccount";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [101, 115, 99, 114, 111, 119];
              },
              {
                kind: "account";
                path: "store";
              }
            ];
          };
        },
        {
          name: "loyaltyMintInfo";
          writable: true;
          optional: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  108,
                  111,
                  121,
                  97,
                  108,
                  116,
                  121,
                  95,
                  109,
                  105,
                  110,
                  116
                ];
              },
              {
                kind: "account";
                path: "store";
              }
            ];
          };
        },
        {
          name: "tokenMint";
          writable: true;
          optional: true;
        },
        {
          name: "tokenAccount";
          writable: true;
          optional: true;
        },
        {
          name: "mintAuthority";
          writable: true;
          signer: true;
          optional: true;
        },
        {
          name: "tokenProgram";
          optional: true;
          address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        }
      ];
      args: [
        {
          name: "productIds";
          type: {
            vec: "pubkey";
          };
        },
        {
          name: "quantities";
          type: {
            vec: "u64";
          };
        },
        {
          name: "totalAmountPaid";
          type: "u64";
        }
      ];
    },
    {
      name: "redeemLoyaltyPoints";
      discriminator: [187, 195, 185, 155, 179, 96, 149, 0];
      accounts: [
        {
          name: "store";
          writable: true;
        },
        {
          name: "loyaltyMintAccount";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  108,
                  111,
                  121,
                  97,
                  108,
                  116,
                  121,
                  95,
                  109,
                  105,
                  110,
                  116
                ];
              },
              {
                kind: "account";
                path: "store";
              }
            ];
          };
        },
        {
          name: "tokenMint";
          writable: true;
        },
        {
          name: "tokenAccount";
          writable: true;
        },
        {
          name: "user";
          signer: true;
        },
        {
          name: "escrowAccount";
          writable: true;
          optional: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [101, 115, 99, 114, 111, 119];
              },
              {
                kind: "account";
                path: "store";
              }
            ];
          };
        },
        {
          name: "tokenProgram";
          address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        }
      ];
      args: [
        {
          name: "pointsToRedeem";
          type: "u64";
        },
        {
          name: "redeemForSol";
          type: "bool";
        }
      ];
    },
    {
      name: "refundFromEscrow";
      discriminator: [52, 190, 158, 62, 194, 173, 200, 247];
      accounts: [
        {
          name: "store";
          writable: true;
        },
        {
          name: "storeOwner";
          signer: true;
        },
        {
          name: "buyer";
          writable: true;
        },
        {
          name: "escrowAccount";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [101, 115, 99, 114, 111, 119];
              },
              {
                kind: "account";
                path: "store";
              }
            ];
          };
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        }
      ];
      args: [
        {
          name: "amount";
          type: "u64";
        }
      ];
    },
    {
      name: "registerProduct";
      discriminator: [224, 97, 195, 220, 124, 218, 78, 43];
      accounts: [
        {
          name: "payer";
          writable: true;
          signer: true;
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        }
      ];
      args: [
        {
          name: "productId";
          type: "pubkey";
        },
        {
          name: "storeId";
          type: "pubkey";
        },
        {
          name: "name";
          type: "string";
        },
        {
          name: "description";
          type: "string";
        },
        {
          name: "imageUri";
          type: "string";
        },
        {
          name: "price";
          type: "u64";
        },
        {
          name: "inventory";
          type: {
            option: "u64";
          };
        },
        {
          name: "attributes";
          type: {
            vec: {
              defined: {
                name: "productAttribute";
              };
            };
          };
        }
      ];
    },
    {
      name: "registerStore";
      discriminator: [63, 55, 152, 6, 167, 127, 89, 129];
      accounts: [
        {
          name: "store";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [115, 116, 111, 114, 101];
              },
              {
                kind: "account";
                path: "authority";
              }
            ];
          };
        },
        {
          name: "authority";
          signer: true;
        },
        {
          name: "payer";
          writable: true;
          signer: true;
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        }
      ];
      args: [
        {
          name: "storeId";
          type: "pubkey";
        },
        {
          name: "name";
          type: "string";
        },
        {
          name: "description";
          type: "string";
        },
        {
          name: "logoUri";
          type: "string";
        },
        {
          name: "loyaltyConfig";
          type: {
            defined: {
              name: "loyaltyConfig";
            };
          };
        }
      ];
    },
    {
      name: "releaseEscrow";
      discriminator: [146, 253, 129, 233, 20, 145, 181, 206];
      accounts: [
        {
          name: "store";
          writable: true;
        },
        {
          name: "storeOwner";
          writable: true;
          signer: true;
        },
        {
          name: "escrowAccount";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [101, 115, 99, 114, 111, 119];
              },
              {
                kind: "account";
                path: "store";
              }
            ];
          };
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        }
      ];
      args: [
        {
          name: "amount";
          type: "u64";
        }
      ];
    },
    {
      name: "removePlatformAdmin";
      discriminator: [182, 87, 52, 81, 16, 1, 172, 34];
      accounts: [
        {
          name: "payer";
          writable: true;
          signer: true;
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        }
      ];
      args: [
        {
          name: "adminPubkey";
          type: "pubkey";
        },
        {
          name: "rootPassword";
          type: "string";
        }
      ];
    },
    {
      name: "removeStoreAdmin";
      discriminator: [20, 178, 174, 192, 18, 15, 252, 96];
      accounts: [
        {
          name: "payer";
          writable: true;
          signer: true;
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        }
      ];
      args: [
        {
          name: "storeId";
          type: "pubkey";
        },
        {
          name: "adminPubkey";
          type: "pubkey";
        }
      ];
    },
    {
      name: "scanAndPurchase";
      discriminator: [123, 177, 142, 160, 80, 85, 135, 57];
      accounts: [
        {
          name: "payer";
          writable: true;
          signer: true;
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        }
      ];
      args: [
        {
          name: "productIds";
          type: {
            vec: "pubkey";
          };
        },
        {
          name: "quantities";
          type: {
            vec: "u64";
          };
        },
        {
          name: "userId";
          type: "pubkey";
        }
      ];
    },
    {
      name: "updateProduct";
      discriminator: [139, 180, 241, 126, 123, 240, 13, 224];
      accounts: [
        {
          name: "payer";
          writable: true;
          signer: true;
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        }
      ];
      args: [
        {
          name: "productId";
          type: "pubkey";
        },
        {
          name: "name";
          type: {
            option: "string";
          };
        },
        {
          name: "description";
          type: {
            option: "string";
          };
        },
        {
          name: "imageUri";
          type: {
            option: "string";
          };
        },
        {
          name: "price";
          type: {
            option: "u64";
          };
        },
        {
          name: "inventory";
          type: {
            option: "u64";
          };
        },
        {
          name: "attributes";
          type: {
            option: {
              vec: {
                defined: {
                  name: "productAttribute";
                };
              };
            };
          };
        }
      ];
    },
    {
      name: "updateStore";
      discriminator: [169, 49, 137, 251, 233, 234, 172, 103];
      accounts: [
        {
          name: "payer";
          writable: true;
          signer: true;
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        }
      ];
      args: [
        {
          name: "storeId";
          type: "pubkey";
        },
        {
          name: "name";
          type: {
            option: "string";
          };
        },
        {
          name: "description";
          type: {
            option: "string";
          };
        },
        {
          name: "logoUri";
          type: {
            option: "string";
          };
        },
        {
          name: "loyaltyConfig";
          type: {
            option: {
              defined: {
                name: "loyaltyConfig";
              };
            };
          };
        }
      ];
    }
  ];
  accounts: [
    {
      name: "escrow";
      discriminator: [31, 213, 123, 187, 186, 22, 218, 155];
    },
    {
      name: "loyaltyMint";
      discriminator: [121, 219, 194, 140, 80, 187, 176, 112];
    },
    {
      name: "purchase";
      discriminator: [33, 203, 1, 252, 231, 228, 8, 67];
    },
    {
      name: "store";
      discriminator: [130, 48, 247, 244, 182, 191, 30, 26];
    }
  ];
  events: [
    {
      name: "adminAdded";
      discriminator: [23, 13, 37, 90, 130, 53, 75, 251];
    },
    {
      name: "adminRemoved";
      discriminator: [59, 133, 36, 27, 156, 79, 75, 146];
    },
    {
      name: "cartPurchased";
      discriminator: [224, 208, 17, 224, 206, 127, 200, 205];
    },
    {
      name: "loyaltyPointsEarned";
      discriminator: [124, 20, 28, 29, 94, 218, 175, 31];
    },
    {
      name: "loyaltyPointsRedeemed";
      discriminator: [23, 105, 3, 227, 115, 164, 155, 2];
    },
    {
      name: "loyaltyTokensMinted";
      discriminator: [33, 246, 193, 3, 190, 56, 188, 46];
    },
    {
      name: "platformAdminAdded";
      discriminator: [231, 252, 87, 10, 68, 133, 55, 246];
    },
    {
      name: "platformAdminRemoved";
      discriminator: [253, 234, 128, 75, 56, 254, 40, 79];
    },
    {
      name: "purchaseCompleted";
      discriminator: [166, 14, 235, 151, 212, 162, 21, 41];
    },
    {
      name: "storeRegistered";
      discriminator: [8, 21, 234, 141, 147, 227, 16, 145];
    },
    {
      name: "storeUpdated";
      discriminator: [218, 7, 142, 56, 57, 63, 185, 211];
    },
    {
      name: "userProfileUpdated";
      discriminator: [137, 227, 236, 168, 126, 29, 3, 132];
    }
  ];
  errors: [
    {
      code: 6000;
      name: "invalidPrice";
      msg: "Invalid price";
    },
    {
      code: 6001;
      name: "invalidStock";
      msg: "Invalid stock";
    },
    {
      code: 6002;
      name: "outOfStock";
      msg: "Product is out of stock";
    },
    {
      code: 6003;
      name: "insufficientPayment";
      msg: "Insufficient payment";
    },
    {
      code: 6004;
      name: "stockUnderflow";
      msg: "Stock underflow";
    },
    {
      code: 6005;
      name: "unauthorized";
      msg: "unauthorized";
    },
    {
      code: 6006;
      name: "cartEmpty";
      msg: "Cart is empty";
    },
    {
      code: 6007;
      name: "invalidCart";
      msg: "Invalid cart (mismatched product and quantity arrays)";
    },
    {
      code: 6008;
      name: "productNotFound";
      msg: "Product not found";
    },
    {
      code: 6009;
      name: "insufficientStock";
      msg: "Insufficient stock";
    },
    {
      code: 6010;
      name: "priceOverflow";
      msg: "Price overflow when summing cart";
    },
    {
      code: 6011;
      name: "cartTooLarge";
      msg: "Cart too large";
    },
    {
      code: 6012;
      name: "adminAlreadyExists";
      msg: "Admin already exists";
    },
    {
      code: 6013;
      name: "cannotRemoveOwner";
      msg: "Cannot remove owner";
    },
    {
      code: 6014;
      name: "storeNotFound";
      msg: "Store not found";
    },
    {
      code: 6015;
      name: "unauthorizedStoreAccess";
      msg: "Unauthorized store access";
    },
    {
      code: 6016;
      name: "adminNotFound";
      msg: "Admin not found";
    },
    {
      code: 6017;
      name: "userNotFound";
      msg: "User not found";
    },
    {
      code: 6018;
      name: "arithmeticError";
      msg: "Arithmetic error";
    },
    {
      code: 6019;
      name: "invalidStoreId";
      msg: "Invalid store ID";
    },
    {
      code: 6020;
      name: "invalidProductId";
      msg: "Invalid product ID";
    },
    {
      code: 6021;
      name: "invalidAdminId";
      msg: "Invalid admin ID";
    },
    {
      code: 6022;
      name: "invalidLoyaltyConfig";
      msg: "Invalid loyalty configuration";
    },
    {
      code: 6023;
      name: "storeInactive";
      msg: "Store is inactive";
    },
    {
      code: 6024;
      name: "insufficientLoyaltyPoints";
      msg: "Insufficient loyalty points";
    },
    {
      code: 6025;
      name: "loyaltyProgramInactive";
      msg: "Loyalty program is inactive";
    },
    {
      code: 6026;
      name: "invalidParameters";
      msg: "Invalid parameters";
    },
    {
      code: 6027;
      name: "insufficientFunds";
      msg: "Insufficient funds";
    },
    {
      code: 6028;
      name: "invalidMetadataUri";
      msg: "Invalid metadata URI";
    },
    {
      code: 6029;
      name: "invalidAdminRole";
      msg: "Invalid admin role";
    },
    {
      code: 6030;
      name: "invalidStore";
      msg: "Invalid store";
    },
    {
      code: 6031;
      name: "escrowNotFound";
      msg: "Escrow account not found";
    },
    {
      code: 6032;
      name: "loyaltyMintNotFound";
      msg: "Loyalty mint not found";
    },
    {
      code: 6033;
      name: "invalidLoyaltyPoints";
      msg: "Invalid loyalty points";
    },
    {
      code: 6034;
      name: "transferHookError";
      msg: "Transfer hook error";
    }
  ];
  types: [
    {
      name: "adminAdded";
      type: {
        kind: "struct";
        fields: [
          {
            name: "storeId";
            type: "pubkey";
          },
          {
            name: "adminPubkey";
            type: "pubkey";
          },
          {
            name: "roleType";
            type: {
              defined: {
                name: "adminRoleType";
              };
            };
          },
          {
            name: "addedAt";
            type: "i64";
          }
        ];
      };
    },
    {
      name: "adminRemoved";
      type: {
        kind: "struct";
        fields: [
          {
            name: "storeId";
            type: "pubkey";
          },
          {
            name: "adminPubkey";
            type: "pubkey";
          },
          {
            name: "removedAt";
            type: "i64";
          }
        ];
      };
    },
    {
      name: "adminRole";
      type: {
        kind: "struct";
        fields: [
          {
            name: "adminPubkey";
            type: "pubkey";
          },
          {
            name: "roleType";
            type: {
              defined: {
                name: "adminRoleType";
              };
            };
          }
        ];
      };
    },
    {
      name: "adminRoleType";
      type: {
        kind: "enum";
        variants: [
          {
            name: "owner";
          },
          {
            name: "manager";
          },
          {
            name: "viewer";
          }
        ];
      };
    },
    {
      name: "cartPurchased";
      docs: ["off‑chain log"];
      type: {
        kind: "struct";
        fields: [
          {
            name: "storeId";
            type: "pubkey";
          },
          {
            name: "buyerId";
            type: "pubkey";
          },
          {
            name: "productUuids";
            type: {
              vec: {
                array: ["u8", 16];
              };
            };
          },
          {
            name: "quantities";
            type: {
              vec: "u64";
            };
          },
          {
            name: "totalPaid";
            type: "u64";
          },
          {
            name: "gasFee";
            type: "u64";
          },
          {
            name: "timestamp";
            type: "i64";
          }
        ];
      };
    },
    {
      name: "escrow";
      type: {
        kind: "struct";
        fields: [
          {
            name: "store";
            type: "pubkey";
          },
          {
            name: "balance";
            type: "u64";
          }
        ];
      };
    },
    {
      name: "loyaltyConfig";
      type: {
        kind: "struct";
        fields: [
          {
            name: "pointsPerDollar";
            type: "u64";
          },
          {
            name: "redemptionRate";
            type: "u64";
          }
        ];
      };
    },
    {
      name: "loyaltyMint";
      type: {
        kind: "struct";
        fields: [
          {
            name: "store";
            type: "pubkey";
          },
          {
            name: "mint";
            type: "pubkey";
          },
          {
            name: "authority";
            type: "pubkey";
          },
          {
            name: "pointsPerSol";
            type: "u64";
          },
          {
            name: "redemptionRate";
            type: "u64";
          },
          {
            name: "totalPointsIssued";
            type: "u64";
          },
          {
            name: "totalPointsRedeemed";
            type: "u64";
          },
          {
            name: "isToken2022";
            type: "bool";
          }
        ];
      };
    },
    {
      name: "loyaltyPointsEarned";
      type: {
        kind: "struct";
        fields: [
          {
            name: "user";
            type: "pubkey";
          },
          {
            name: "storeId";
            type: "pubkey";
          },
          {
            name: "pointsEarned";
            type: "u64";
          },
          {
            name: "totalPoints";
            type: "u64";
          },
          {
            name: "timestamp";
            type: "i64";
          }
        ];
      };
    },
    {
      name: "loyaltyPointsRedeemed";
      type: {
        kind: "struct";
        fields: [
          {
            name: "user";
            type: "pubkey";
          },
          {
            name: "storeId";
            type: "pubkey";
          },
          {
            name: "pointsRedeemed";
            type: "u64";
          },
          {
            name: "discountValue";
            type: "u64";
          },
          {
            name: "remainingPoints";
            type: "u64";
          },
          {
            name: "timestamp";
            type: "i64";
          }
        ];
      };
    },
    {
      name: "loyaltyTokensMinted";
      type: {
        kind: "struct";
        fields: [
          {
            name: "user";
            type: "pubkey";
          },
          {
            name: "amount";
            type: "u64";
          },
          {
            name: "remainingPoints";
            type: "u64";
          },
          {
            name: "timestamp";
            type: "i64";
          }
        ];
      };
    },
    {
      name: "platformAdminAdded";
      type: {
        kind: "struct";
        fields: [
          {
            name: "adminPubkey";
            type: "pubkey";
          },
          {
            name: "addedAt";
            type: "i64";
          }
        ];
      };
    },
    {
      name: "platformAdminRemoved";
      type: {
        kind: "struct";
        fields: [
          {
            name: "adminPubkey";
            type: "pubkey";
          },
          {
            name: "removedAt";
            type: "i64";
          }
        ];
      };
    },
    {
      name: "productAttribute";
      type: {
        kind: "struct";
        fields: [
          {
            name: "name";
            type: "string";
          },
          {
            name: "value";
            type: "string";
          }
        ];
      };
    },
    {
      name: "purchase";
      type: {
        kind: "struct";
        fields: [
          {
            name: "productIds";
            type: {
              vec: "pubkey";
            };
          },
          {
            name: "quantities";
            type: {
              vec: "u64";
            };
          },
          {
            name: "totalPaid";
            type: "u64";
          },
          {
            name: "gasFee";
            type: "u64";
          },
          {
            name: "store";
            type: "pubkey";
          },
          {
            name: "buyer";
            type: "pubkey";
          },
          {
            name: "timestamp";
            type: "i64";
          }
        ];
      };
    },
    {
      name: "purchaseCompleted";
      type: {
        kind: "struct";
        fields: [
          {
            name: "store";
            type: "pubkey";
          },
          {
            name: "buyer";
            type: "pubkey";
          },
          {
            name: "totalAmount";
            type: "u64";
          },
          {
            name: "timestamp";
            type: "i64";
          },
          {
            name: "loyaltyPointsEarned";
            type: "u64";
          }
        ];
      };
    },
    {
      name: "store";
      type: {
        kind: "struct";
        fields: [
          {
            name: "owner";
            type: "pubkey";
          },
          {
            name: "name";
            type: "string";
          },
          {
            name: "description";
            type: "string";
          },
          {
            name: "logoUri";
            type: "string";
          },
          {
            name: "loyaltyConfig";
            type: {
              defined: {
                name: "loyaltyConfig";
              };
            };
          },
          {
            name: "isActive";
            type: "bool";
          },
          {
            name: "revenue";
            type: "u64";
          },
          {
            name: "adminRoles";
            type: {
              vec: {
                defined: {
                  name: "adminRole";
                };
              };
            };
          }
        ];
      };
    },
    {
      name: "storeRegistered";
      type: {
        kind: "struct";
        fields: [
          {
            name: "storeId";
            type: "pubkey";
          },
          {
            name: "owner";
            type: "pubkey";
          },
          {
            name: "name";
            type: "string";
          },
          {
            name: "createdAt";
            type: "i64";
          }
        ];
      };
    },
    {
      name: "storeUpdated";
      type: {
        kind: "struct";
        fields: [
          {
            name: "storeId";
            type: "pubkey";
          },
          {
            name: "updatedBy";
            type: "pubkey";
          },
          {
            name: "updatedAt";
            type: "i64";
          }
        ];
      };
    },
    {
      name: "userProfileUpdated";
      type: {
        kind: "struct";
        fields: [
          {
            name: "walletAddress";
            type: "pubkey";
          },
          {
            name: "userId";
            type: "string";
          },
          {
            name: "updatedAt";
            type: "i64";
          }
        ];
      };
    }
  ];
};
