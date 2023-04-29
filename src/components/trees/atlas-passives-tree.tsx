import React, { useEffect, useState } from "react";
import { gql, TypedDocumentNode, useQuery } from "@apollo/client";
import { PassiveTreeResponse } from "@generated/graphql";
import { usePoeLeagueCtx } from "@contexts/league-context";
import NodesTree from "./nodes-tree/nodes-tree";
import createResetZoomEventEmitter, {
  ResetEventEmitter,
} from "./nodes-tree/reset-zoom-event-emitter";
import StyledButton from "@components/library/styled-button";
import StyledLoading from "@components/library/styled-loading";

const atlasPassivesLayoutQuery: TypedDocumentNode<{
  atlasTree: PassiveTreeResponse;
}> = gql`
  query PassiveAtlasTree($passiveTreeVersion: String!) {
    atlasTree(passiveTreeVersion: $passiveTreeVersion) {
      constants {
        minX
        minY
        maxX
        maxY
        skillsPerOrbit
        orbitRadii
      }
      nodeMap
      connectionMap
    }
  }
`;

/**
 * Displays the Atlas Passives tree for the given version.
 *
 * If selectedNodes are passed it will highlight the nodes and
 * connections between them.
 */
export default function AtlasPassivesTree({
  selectedNodes,
  nodeColorOverrides,
  version,
}: {
  selectedNodes?: Array<number>;
  nodeColorOverrides?: Record<string, string>;
  version: string;
}) {
  const { league } = usePoeLeagueCtx();

  const [treeData, setTreeData] = useState<PassiveTreeResponse>();

  const [resetEmitter, setResetEmitter] = useState<ResetEventEmitter>();

  const { refetch, loading } = useQuery(atlasPassivesLayoutQuery, {
    skip: true,
    variables: {
      passiveTreeVersion: version,
      league: league,
    },
    onCompleted({ atlasTree }) {
      setTreeData(atlasTree);
      if (atlasTree) {
        localStorage.setItem(
          `${version}_atlas_passives_tree_data`,
          JSON.stringify(atlasTree)
        );
      }
    },
  });

  useEffect(() => {
    setResetEmitter(createResetZoomEventEmitter());
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && !treeData) {
      const localData = localStorage.getItem(
        `${version}_atlas_passives_tree_data`
      );
      if (localData) {
        setTreeData(JSON.parse(localData));
      } else {
        refetch();
      }
    }
  }, [treeData, refetch, version]);

  return (
    <>
      {loading || !treeData ? (
        <StyledLoading />
      ) : (
        <>
          <StyledButton
            className={"w-32"}
            text={"Reset View"}
            onClick={() => {
              resetEmitter?.dispatch();
            }}
          />

          <NodesTree
            treeData={treeData}
            nodeColorOverrides={nodeColorOverrides}
            selectedNodes={selectedNodes}
            resetZoomEmitter={resetEmitter}
          />
        </>
      )}
    </>
  );
}
