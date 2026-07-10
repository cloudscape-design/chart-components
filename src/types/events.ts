// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export type NonCancelableCustomEvent<DetailType> = Omit<CustomEvent<DetailType>, "preventDefault">;

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type NonCancelableEventHandler<Detail = {}> = (event: NonCancelableCustomEvent<Detail>) => void;
